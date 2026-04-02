import { supabase } from '../config/supabase';

/**
 * Site Settings Service
 *
 * Manages global website settings like development mode
 */

export interface SiteSetting {
  id: string;
  key: string;
  value: string;
  description?: string;
  updated_at: string;
  created_at: string;
}

/**
 * Get a site setting by key
 */
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

/**
 * Get all site settings
 */
export async function getAllSettings(): Promise<Record<string, string>> {
  const { data, error } = await supabase
    .from('site_settings')
    .select('*');

  if (error || !data) {
    return {};
  }

  const settings: Record<string, string> = {};
  for (const item of data as SiteSetting[]) {
    settings[item.key] = item.value;
  }

  return settings;
}

/**
 * Check if website is in development mode
 */
export async function isDevelopmentMode(): Promise<boolean> {
  const value = await getSetting('development_mode');
  return value === 'true';
}

/**
 * Update a site setting (admin only)
 */
export async function updateSetting(key: string, value: string): Promise<void> {
  const { error } = await supabase
    .from('site_settings')
    .upsert({ key, value }, { onConflict: 'key' });

  if (error) {
    throw error;
  }
}

/**
 * Set development mode (admin only)
 */
export async function setDevelopmentMode(enabled: boolean): Promise<void> {
  await updateSetting('development_mode', enabled ? 'true' : 'false');
}
