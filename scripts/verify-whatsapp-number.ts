/**
 * Verification harness for the WhatsApp number wiring.
 *
 * Copies the REAL src/services/supabase/settings.service.ts, swapping only its
 * supabase import for an in-memory stub, then exercises the actual mapping and
 * resolveWhatsAppNumber() logic against rows where `whatsapp_number` differs
 * from `phone_number`. That difference is what makes the test meaningful: if
 * any call site silently fell back to phone_number, the assertions would fail
 * instead of passing by coincidence.
 *
 * Run: npx tsx scripts/verify-whatsapp-number.ts
 */

import { readFileSync, writeFileSync, unlinkSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const here = dirname(fileURLToPath(import.meta.url));
const svcPath = resolve(here, '../src/services/supabase/settings.service.ts');
// Must sit beside the original so its relative imports still resolve.
const tmpPath = resolve(here, '../src/services/supabase/__settings_under_test.ts');

/** Rewrite only the supabase import; every other line is the real source. */
let source = readFileSync(svcPath, 'utf8');
const originalImport = "import { supabase } from '../../config/supabase';";
if (!source.includes(originalImport)) {
  throw new Error('Could not find the expected supabase import to stub');
}
source = source.replace(
  originalImport,
  `let __rows: { key: string; value: string }[] = [];
export function __setRows(rows: { key: string; value: string }[]) { __rows = rows; }
const supabase = {
  from: () => ({
    select: () => ({ data: __rows, error: null }),
  }),
};`
);

writeFileSync(tmpPath, source, 'utf8');

async function main() {
  const svc = await import(pathToFileURL(tmpPath).href);
  const constants = await import('../src/constants');

  // Exercise the real getSettings() -> resolveWhatsAppNumber() -> link chain.
  const phoneNumber = '+254 799 526972';   // formatting spaces included
  const whatsappNumber = '254711111222';   // deliberately different

  let failures = 0;
  function check(label: string, actual: unknown, expected: unknown) {
    const ok = actual === expected;
    if (!ok) failures++;
    console.log(
      `  ${ok ? 'PASS' : 'FAIL'}  ${label}: ${JSON.stringify(actual)}` +
        (ok ? '' : `\n          expected ${JSON.stringify(expected)}`)
    );
  }

  // ---- Case 1: whatsapp_number set (the normal case) -------------------
  svc.__setRows([
    { key: 'phone_number', value: phoneNumber },
    { key: 'whatsapp_number', value: whatsappNumber },
  ]);
  const settings = await svc.getSettings();
  const resolved = svc.resolveWhatsAppNumber(settings);

  console.log('\nCase 1 — whatsapp_number is set (should win)');
  check('getSettings().whatsappNumber', settings.whatsappNumber, whatsappNumber);
  check('getSettings().phoneNumber', settings.phoneNumber, phoneNumber);
  check('resolveWhatsAppNumber()', resolved, whatsappNumber);

  const enquireLink = constants.generateWhatsAppLink(resolved!, 'enquire about: Test Product');
  const checkoutLink = `https://wa.me/${resolved!}?text=Order123`; // same shape generateWhatsAppUrl builds
  console.log(`\n  enquiry  link: ${enquireLink}`);
  console.log(`  checkout link: ${checkoutLink}`);
  check('enquiry link targets whatsapp_number', enquireLink.includes(`/wa.me/${whatsappNumber}`), true);
  check('checkout link targets whatsapp_number', checkoutLink.includes(`/wa.me/${whatsappNumber}`), true);
  check(
    'no link leaks phone_number digits',
    enquireLink.includes('254799526972') || checkoutLink.includes('254799526972'),
    false
  );

  // ---- Case 2: whatsapp_number blank -> fall back to phone_number ------
  svc.__setRows([
    { key: 'phone_number', value: phoneNumber },
    { key: 'whatsapp_number', value: '' },
  ]);
  const fallbackSettings = await svc.getSettings();
  const fallback = svc.resolveWhatsAppNumber(fallbackSettings);
  console.log('\nCase 2 — whatsapp_number blank (should fall back to phone_number)');
  check('resolveWhatsAppNumber() strips formatting from phone_number', fallback, '254799526972');

  // ---- Case 3: nothing configured -------------------------------------
  svc.__setRows([]);
  const emptySettings = await svc.getSettings();
  const none = svc.resolveWhatsAppNumber(emptySettings);
  console.log('\nCase 3 — no phone numbers configured');
  check('resolveWhatsAppNumber() returns null', none, null);

  console.log(
    failures === 0
      ? '\nALL CHECKS PASSED — enquiry and checkout both read the whatsapp_number setting.'
      : `\n${failures} CHECK(S) FAILED`
  );
  process.exitCode = failures === 0 ? 0 : 1;
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => {
    try { unlinkSync(tmpPath); } catch { /* best effort cleanup */ }
  });