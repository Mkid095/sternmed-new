/**
 * Firebase ID token verification for Edge Functions.
 *
 * Single source of truth for `manage-orders` and `admin-operations`.
 *
 * Why this exists
 * ---------------
 * `admin-operations` had this:
 *
 *   const payload = JSON.parse(atob(token.split('.')[1]))
 *   if (payload.exp && payload.exp < Date.now() / 1000) return null
 *   return payload
 *
 * That decodes the token. It does not verify it. The signature was never
 * checked, so anyone could craft a JWT with any `uid` and any `exp`, present it,
 * and be treated as whoever they named — after which the function used its
 * service-role key to create and delete admins and aliases. The comment in that
 * file acknowledged it ("In production, use Firebase Admin SDK"), but the
 * function was one call away from being wired up.
 *
 * How this works
 * --------------
 * Real verification against Google's published x509 certificates, via `jose`:
 * signature, issuer, audience and expiry are all checked, and any failure
 * rejects.
 *
 * The certificate handling is the fiddly part and is why `jose` is used rather
 * than hand-rolling. Google's endpoint returns full X.509 certificates, and
 * `crypto.subtle.importKey('spki', der, ...)` rejects those:
 *
 *   ASN.1 error: unexpected ASN.1 DER tag: expected OBJECT IDENTIFIER,
 *   got CONTEXT-SPECIFIC [0] (constructed) at DER byte 8
 *
 * A certificate and a SubjectPublicKeyInfo are different ASN.1 structures; the
 * SPKI has to be extracted from inside the certificate first. `jose`'s
 * `importX509` does exactly that, and `jwtVerify` then performs the whole
 * verification in one step.
 *
 * Why not the service-account route
 * ---------------------------------
 * Verifying an ID token needs only PUBLIC keys. The alternative used by
 * `set-user-password` signs its own JWT with the service account's private key
 * and calls accounts:lookup — also correct, but it needs
 * `GOOGLE_APPLICATION_CREDENTIALS` set as an edge-function secret, and Supabase
 * secrets are per-function. This way works the moment a function is deployed,
 * with no secret to provision.
 */

import { importX509, jwtVerify, type JWTPayload } from 'npm:jose@5';

const CERT_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

/** Cached certs. Google rotates these roughly monthly. */
let certCache: { keys: Record<string, string>; fetchedAt: number } | null = null;
const CERT_TTL_MS = 60 * 60 * 1000; // an hour

async function getCerts(): Promise<Record<string, string>> {
  if (certCache && Date.now() - certCache.fetchedAt < CERT_TTL_MS) {
    return certCache.keys;
  }

  const response = await fetch(CERT_URL);
  if (!response.ok) {
    throw new Error(`Could not fetch Firebase signing certificates (HTTP ${response.status})`);
  }

  const keys = (await response.json()) as Record<string, string>;
  certCache = { keys, fetchedAt: Date.now() };
  return keys;
}

/**
 * The `kid` from the token header.
 *
 * Read before verifying so the matching certificate can be selected. `jose`
 * throws on a malformed token anyway, so this only needs to be good enough to
 * find the key.
 */
function readKeyId(token: string): string | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  try {
    const headerJson = new TextDecoder().decode(
      Uint8Array.from(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0)),
    );
    const kid = (JSON.parse(headerJson) as { kid?: unknown }).kid;
    return typeof kid === 'string' && kid ? kid : null;
  } catch {
    return null;
  }
}

export interface VerifiedFirebaseUser {
  uid: string;
  email: string | null;
}

/**
 * Verifies a Firebase ID token and returns the identity it proves.
 *
 * Throws on anything that is not a currently valid token for this project.
 * Callers must not catch-and-continue: every use of this result is an
 * authorisation decision.
 */
export async function verifyFirebaseIdToken(
  token: string,
  projectId: string,
): Promise<VerifiedFirebaseUser> {
  const kid = readKeyId(token);
  if (!kid) throw new Error('Malformed token');

  const certs = await getCerts();
  const pem = certs[kid];
  if (!pem) {
    // Could be a rotation we have not picked up yet; drop the cache so the
    // next attempt refetches.
    certCache = null;
    throw new Error('Token was signed by an unknown key');
  }

  const key = await importX509(pem, 'RS256');

  // `jwtVerify` enforces the signature and every claim below. `algorithms`
  // pins RS256 so an `alg: none` or HMAC token cannot be substituted.
  let payload: JWTPayload;
  try {
    ({ payload } = await jwtVerify(token, key, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
      algorithms: ['RS256'],
      // Small leeway for clock skew between here and Google.
      clockTolerance: 60,
    }));
  } catch (err) {
    throw new Error(
      `Token rejected: ${err instanceof Error ? err.message : 'verification failed'}`,
    );
  }

  // `sub` is the Firebase uid; `user_id` is the legacy alias of it.
  const uid =
    typeof payload.sub === 'string' && payload.sub
      ? payload.sub
      : typeof (payload as { user_id?: unknown }).user_id === 'string'
        ? ((payload as { user_id: string }).user_id)
        : null;

  if (!uid) throw new Error('Token carries no user id');

  return {
    uid,
    email: typeof payload.email === 'string' ? payload.email : null,
  };
}

/** Pulls the bearer token out of an Authorization header. */
export function bearerFrom(header: string | null): string {
  return (header || '').replace(/^Bearer\s+/i, '').trim();
}

/** Distinguishes "you may not" from "we broke", so the status code is honest. */
export class StaffDeniedError extends Error {}

/**
 * Resolves a verified Firebase uid to a Supabase `users` row and checks the
 * role is one of `allowedRoles`.
 *
 * Separated from verification on purpose: a valid token proves WHO the caller
 * is, not that they may do this. Any caller holding only a Firebase token
 * could otherwise reach the service-role client.
 */
export async function requireStaff(
  supabase: { from: (t: string) => any },
  uid: string,
  allowedRoles: readonly string[],
): Promise<{ id: string; role: string }> {
  const { data, error } = await supabase
    .from('users')
    .select('id, role')
    .eq('firebase_uid', uid)
    .maybeSingle();

  if (error) throw new Error(`Caller lookup failed: ${error.message}`);
  if (!data) throw new StaffDeniedError('No staff account is linked to this login');
  if (!allowedRoles.includes(data.role)) {
    throw new StaffDeniedError(`This action requires one of: ${allowedRoles.join(', ')}`);
  }
  return data as { id: string; role: string };
}