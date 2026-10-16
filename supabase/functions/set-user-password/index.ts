import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * set-user-password
 *
 * Lets an admin set a new Firebase Auth password for any user.
 *
 * The browser Firebase API key cannot change passwords (that would let
 * anyone who obtained the key hijack accounts), so this runs server-side
 * with a service account.
 *
 * Authorization: the caller must send their Firebase ID token. We verify it
 * against Firebase, resolve the caller to a Supabase `users` row, and require
 * role = 'admin'. Verifying only the token signature is not enough — without
 * the Supabase role check any authenticated email_user could reset an admin's
 * password.
 */

interface ServiceAccount {
  project_id: string;
  client_email: string;
  private_key: string;
}

/** Minimum password length accepted by Firebase Auth. */
const MIN_PASSWORD_LENGTH = 8;

/** Encode a string to base64url (URL-safe base64, no padding). */
function base64urlEncode(str: string): string {
  return btoa(str).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

/**
 * Build a signed RS256 JWT and exchange it for a Google OAuth2 access token.
 * Uses Web Crypto so this stays Deno-compatible (no Node crypto, no Admin SDK).
 */
async function getGoogleAccessToken(serviceAccount: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  const header = base64urlEncode(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64urlEncode(
    JSON.stringify({
      iss: serviceAccount.client_email,
      scope: 'https://www.googleapis.com/auth/cloud-platform',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    })
  );
  const signingInput = `${header}.${payload}`;

  const pemKey = serviceAccount.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\n/g, '');

  const binaryKey = Uint8Array.from(atob(pemKey), (c) => c.charCodeAt(0));
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    new TextEncoder().encode(signingInput)
  );

  const jwt = `${signingInput}.${base64urlEncode(
    String.fromCharCode(...new Uint8Array(signature))
  )}`;

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  const data = await tokenResponse.json();
  if (!tokenResponse.ok) {
    throw new Error(
      `OAuth2 token error: ${data.error_description || data.error || 'unknown'}`
    );
  }
  return data.access_token;
}

function getServiceAccount(): ServiceAccount {
  const credsJson = Deno.env.get('GOOGLE_APPLICATION_CREDENTIALS');
  if (!credsJson) {
    throw new Error(
      'GOOGLE_APPLICATION_CREDENTIALS secret is not set. Add the Firebase ' +
        'service account JSON in Supabase Edge Function secrets.'
    );
  }

  let creds: ServiceAccount;
  try {
    creds = JSON.parse(credsJson);
  } catch {
    throw new Error('GOOGLE_APPLICATION_CREDENTIALS is not valid JSON');
  }

  if (!creds.project_id || !creds.client_email || !creds.private_key) {
    throw new Error('Service account JSON is missing required fields');
  }
  return creds;
}

/** Call a Firebase Auth REST endpoint with the service account access token. */
async function firebaseAuthCall(
  endpoint: string,
  projectId: string,
  accessToken: string,
  body: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/projects/${projectId}/${endpoint}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    }
  );

  const data = await response.json();
  if (!response.ok) {
    const message = (data as { error?: { message?: string } })?.error?.message;
    throw new Error(message || `Firebase request failed (HTTP ${response.status})`);
  }
  return data as Record<string, unknown>;
}

/**
 * Resolve a Firebase ID token to its Firebase UID via accounts:lookup.
 * Throws if the token is missing, expired, or invalid.
 */
async function resolveCallerUid(
  idToken: string,
  projectId: string,
  accessToken: string
): Promise<string> {
  const data = await firebaseAuthCall('accounts:lookup', projectId, accessToken, {
    idToken,
  });

  const users = data.users as Array<{ localId?: string }> | undefined;
  const uid = users?.[0]?.localId;
  if (!uid) {
    throw new Error('Could not resolve the caller identity from the provided token');
  }
  return uid;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    });
  }

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, content-type',
  };

  const json = (body: unknown, status: number) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  try {
    const { userId, password } = await req.json();

    if (!userId || typeof password !== 'string') {
      return json({ error: 'userId and password are required' }, 400);
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return json(
        { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` },
        400
      );
    }

    // ---- Authenticate the caller -------------------------------------
    const authHeader = req.headers.get('Authorization') || '';
    const idToken = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!idToken) {
      return json({ error: 'Missing authorization token' }, 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabase = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const serviceAccount = getServiceAccount();
    const accessToken = await getGoogleAccessToken(serviceAccount);

    let callerUid: string;
    try {
      callerUid = await resolveCallerUid(
        idToken,
        serviceAccount.project_id,
        accessToken
      );
    } catch {
      // Don't leak whether the token was malformed vs merely expired
      return json({ error: 'Invalid or expired session. Please sign in again.' }, 401);
    }

    // ---- Authorize: caller must be an admin ---------------------------
    const { data: caller, error: callerError } = await supabase
      .from('users')
      .select('id, role')
      .eq('firebase_uid', callerUid)
      .single();

    if (callerError || !caller) {
      return json({ error: 'Only admins can reset user passwords' }, 403);
    }
    if (caller.role !== 'admin') {
      return json({ error: 'Only admins can reset user passwords' }, 403);
    }

    // ---- Resolve the target user --------------------------------------
    const { data: target, error: targetError } = await supabase
      .from('users')
      .select('id, email, firebase_uid')
      .eq('id', userId)
      .single();

    if (targetError || !target) {
      return json({ error: 'User not found' }, 404);
    }
    if (!target.firebase_uid) {
      return json(
        { error: 'This user has no linked login account, so their password cannot be set' },
        400
      );
    }

    // ---- Set the new password ------------------------------------------
    try {
      await firebaseAuthCall('accounts:update', serviceAccount.project_id, accessToken, {
        localId: target.firebase_uid,
        password,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      // EMAIL_EXISTS means the password change itself failed; report it plainly
      return json({ error: `Failed to set password: ${message}` }, 500);
    }

    return json(
      { success: true, message: `Password updated for ${target.email}` },
      200
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('Error in set-user-password:', message);
    return json({ error: message }, 500);
  }
});