/**
 * Header parsing and authentication-result extraction.
 */

export type AuthVerdict = boolean | null; // null = "no evidence", not "passed"

/**
 * Pull a bare address out of a header value.
 *
 * Handles `Display Name <user@host>`, `user@host`, and a bare address. Returns
 * null rather than guessing, so the caller can decide what an unparseable
 * header means.
 */
export function extractAddress(value: string | null | undefined): string | null {
  if (!value) return null;

  const angled = value.match(/<([^>]+)>/);
  if (angled) return angled[1].trim().toLowerCase();

  const bare = value.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);
  if (bare) return bare[0].toLowerCase();

  return null;
}

/** Pull the display name out of a `Display Name <user@host>` header. */
export function extractDisplayName(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const match = value.match(/^\s*"?([^"<>]+?)"?\s*</);
  return match ? match[1].trim() || undefined : undefined;
}

/**
 * Read SPF and DKIM verdicts out of `Authentication-Results`.
 *
 * The previous implementation computed `dkimPass = !raw.includes('dkim=fail')`,
 * which reports a PASS whenever the header is missing entirely — so unauthenticated
 * mail rendered in the UI as DKIM-verified. Absence of evidence now returns null
 * and the UI shows "unverified".
 *
 * `none`/`neutral` are softfail-equivalent and are reported as false, matching
 * RFC 7208 §6.6.
 */
export function parseAuthResults(headerValue: string | null | undefined): {
  spf: AuthVerdict;
  dkim: AuthVerdict;
} {
  if (!headerValue) return { spf: null, dkim: null };

  const spfMatch = headerValue.match(/\bspf\s*=\s*([a-z]+)/i);
  const dkimMatch = headerValue.match(/\bdkim\s*=\s*([a-z-]+)/i);

  const spfVerdict = spfMatch ? verdict(spfMatch[1]) : null;
  const dkimVerdict = dkimMatch ? verdict(dkimMatch[1]) : null;

  return { spf: spfVerdict, dkim: dkimVerdict };
}

function verdict(token: string): boolean {
  const normalised = token.toLowerCase();
  if (normalised === 'pass') return true;
  if (normalised === 'fail' || normalised === 'softfail' || normalised === 'permerror') {
    return false;
  }
  // none / neutral / temperror / policy — no positive authentication evidence.
  return false;
}

/**
 * Collect header entries into a plain object with lowercase keys.
 *
 * `Headers` already lowercases names, but this also keeps the shape stable for
 * the `parseHeaders` consumers that index it directly.
 */
export function parseHeaders(headers: Headers): Record<string, string> {
  return Object.fromEntries(headers.entries());
}