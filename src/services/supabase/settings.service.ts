import { supabase } from '../../config/supabase';
import { SiteSettings, HomepageSection, DEFAULT_HOMEPAGE_SECTIONS } from '../../types';

// Mapping from SiteSettings fields to database keys
const SETTING_KEYS: Record<string, string> = {
  phoneNumber: 'phone_number',
  whatsappNumber: 'whatsapp_number',
  email: 'email',
  address: 'address',
  aboutText: 'about_text',
  privacyPolicy: 'privacy_policy',
  termsOfService: 'terms_of_service',
  featuredSectionEnabled: 'featured_section_enabled',
  featuredProductCount: 'featured_product_count',
  prominentCategories: 'prominent_categories',
  homepageSections: 'homepage_sections',
};

const DEFAULT_SETTINGS: SiteSettings = {
  phoneNumber: '+254 700 000 000',
  whatsappNumber: '',
  email: 'info@sternmed.afrika',
  address: 'Nairobi, Kenya',
  aboutText: 'Your trusted partner in medical consumables and equipment across Africa.',
  privacyPolicy: '',
  termsOfService: '',
  featuredSectionEnabled: true,
  featuredProductCount: 8,
  prominentCategories: [],
  homepageSections: DEFAULT_HOMEPAGE_SECTIONS,
};

/**
 * Parse a string value to appropriate type based on the field
 */
function parseValue(field: string, value: string): unknown {
  switch (field) {
    case 'phoneNumber':
    case 'whatsappNumber':
    case 'email':
    case 'address':
    case 'aboutText':
    case 'privacyPolicy':
    case 'termsOfService':
      return value;
    case 'featuredSectionEnabled':
      return value === 'true';
    case 'featuredProductCount':
      return parseInt(value, 10) || 8;
    case 'prominentCategories':
    case 'homepageSections':
      try {
        return JSON.parse(value);
      } catch {
        return field === 'homepageSections' ? DEFAULT_HOMEPAGE_SECTIONS : [];
      }
    default:
      return value;
  }
}

/**
 * Convert a value to string for storage
 */
function stringifyValue(field: string, value: unknown): string {
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return value.toString();
  if (Array.isArray(value)) return JSON.stringify(value);
  return (value as string) || '';
}

/**
 * Build SiteSettings object from key-value rows
 */
async function fetchAllSettings(): Promise<Record<string, unknown>> {
  const { data, error } = await supabase
    .from('site_settings')
    .select('*');

  if (error || !data || data.length === 0) {
    return {};
  }

  const settings: Record<string, unknown> = {};

  for (const row of data as { key: string; value: string }[]) {
    const field = Object.entries(SETTING_KEYS).find(([, key]) => key === row.key)?.[0];
    if (field) {
      settings[field] = parseValue(field, row.value);
    }
  }

  return settings;
}

// ============ Exported Functions ============

export async function getSettings(): Promise<SiteSettings> {
  const settings = await fetchAllSettings();
  return {
    ...DEFAULT_SETTINGS,
    ...settings,
  } as SiteSettings;
}

export async function updateSettings(updates: Partial<SiteSettings>): Promise<SiteSettings> {
  const upserts = Object.entries(updates)
    .map(([field, value]) => {
      const key = SETTING_KEYS[field];
      if (!key) return null;
      return {
        key,
        value: stringifyValue(field, value),
      };
    })
    .filter((item): item is { key: string; value: string } => item !== null);

  const { error } = await supabase
    .from('site_settings')
    .upsert(upserts, { onConflict: 'key' });

  if (error) {
    throw error;
  }

  return getSettings();
}

export async function getSetting(key: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', key)
    .single();

  if (error || !data) {
    return null;
  }

  return data.value;
}

export async function isDevelopmentMode(): Promise<boolean> {
  const value = await getSetting('development_mode');
  return value === 'true';
}

export async function setDevelopmentMode(enabled: boolean): Promise<void> {
  await updateSetting('development_mode', enabled ? 'true' : 'false');
}

export async function updateSetting(key: string, value: string): Promise<void> {
  const { error } = await supabase
    .from('site_settings')
    .upsert({ key, value }, { onConflict: 'key' });

  if (error) {
    throw error;
  }
}

// ============ WhatsApp Contact Resolution ============

/**
 * Strip a phone number down to wa.me-compatible digits.
 *
 * Keeps digits and a single leading `+` so `tel:` links still work,
 * then wa.me gets only the digits.
 */
export function toWaDigits(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Resolve the WhatsApp contact number from site settings.
 *
 * Prefers the dedicated `whatsapp_number` setting so admin can route
 * enquiries and checkout hand-off to a different line than the general
 * contact number. Falls back to `phone_number` when unset.
 *
 * @param settings - Site settings (may be null while loading)
 * @returns Digits-only number suitable for a wa.me URL, or null if neither is set
 */
export function resolveWhatsAppNumber(
  settings: Partial<SiteSettings> | null | undefined
): string | null {
  const candidate = settings?.whatsappNumber?.trim() || settings?.phoneNumber?.trim();
  if (!candidate) return null;
  return toWaDigits(candidate) || null;
}

// ============ Service Object (for backward compatibility) ============

export const settingsService = {
  getSettings,
  updateSettings,
  getSetting,
  isDevelopmentMode,
  setDevelopmentMode,
  updateSetting,
};
