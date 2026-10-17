/**
 * useSettingsManager Hook
 *
 * Custom hook for managing site settings state and operations.
 * Handles data fetching, form changes, and save operations.
 *
 * @module useSettingsManager
 */

import React, { useState, useCallback, useEffect, useRef, FormEvent, ChangeEvent } from 'react';
import { api } from '../../../../services/api';
import { SiteSettings } from '../../../../types';
import { useToastSuccess, useToastError } from '../../../shared/ui';

/**
 * Settings tab type
 */
export type SettingsTab = 'general' | 'homepage' | 'legal' | 'site-status';

/**
 * Return type for useSettingsManager hook
 */
export interface UseSettingsManagerReturn {
  /** Current settings data */
  settings: Partial<SiteSettings>;

  /** Whether settings are loading */
  loading: boolean;

  /** Whether settings are being saved */
  saving: boolean;

  /** Currently active tab */
  activeTab: SettingsTab;

  /** Update active tab */
  setActiveTab: (tab: SettingsTab) => void;

  /** Handle input change */
  handleChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;

  /** Handle form save */
  handleSave: (e: FormEvent) => Promise<void>;

  /** Update settings directly */
  setSettings: React.Dispatch<React.SetStateAction<Partial<SiteSettings>>>;

  /**
   * True when the form differs from what is in the database.
   *
   * Without this the Save button was always enabled and always looked equally
   * urgent whether or not anything had changed, and leaving the page with
   * edits in the form simply discarded them.
   */
  isDirty: boolean;

  /** Throw away unsaved edits and go back to the stored values. */
  discardChanges: () => void;
}

/**
 * Compares two settings objects for the fields the form actually edits.
 *
 * A full deep-equal would also fire on unrelated keys the API returns
 * (`homepageSections`, which the Landing page owns) and mark the form dirty
 * before the admin has touched anything.
 */
function hasChanges(a: Partial<SiteSettings>, b: Partial<SiteSettings>): boolean {
  const keys: (keyof SiteSettings)[] = [
    'phoneNumber',
    'whatsappNumber',
    'email',
    'address',
    'aboutText',
    'privacyPolicy',
    'termsOfService',
    'featuredProductCount',
    'prominentCategories',
  ];
  return keys.some((key) => JSON.stringify(a[key] ?? null) !== JSON.stringify(b[key] ?? null));
}

/**
 * Initial empty settings state
 */
const INITIAL_SETTINGS: Partial<SiteSettings> = {
  phoneNumber: '',
  whatsappNumber: '',
  email: '',
  address: '',
  aboutText: '',
  privacyPolicy: '',
  termsOfService: '',
  featuredProductCount: 8,
  prominentCategories: [],
};

/**
 * Custom hook for settings page management
 *
 * Provides state management for the settings page:
 * - Fetches settings from API
 * - Manages form state
 * - Handles tab switching
 * - Saves changes to API
 *
 * @returns Settings state and handlers
 *
 * @example
 * function AdminSettings() {
 *   const {
 *     settings,
 *     loading,
 *     saving,
 *     activeTab,
 *     setActiveTab,
 *     handleChange,
 *     handleSave,
 *   } = useSettingsManager();
 *
 *   return <SettingsPage {...} />;
 * }
 */
export function useSettingsManager(): UseSettingsManagerReturn {
  // ============ State ============

  const [settings, setSettings] = useState<Partial<SiteSettings>>(INITIAL_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  /**
   * The values as last read from or written to the database. Ref rather than
   * state: it is only ever read inside `isDirty` and written on fetch/save, and
   * keeping it out of state stops every keystroke re-rendering the page.
   */
  const storedRef = useRef<Partial<SiteSettings>>(INITIAL_SETTINGS);

  const isDirty = hasChanges(settings, storedRef.current);

  // Toast notifications
  const showSuccess = useToastSuccess();
  const showError = useToastError();

  // ============ Data Fetching ============

  /**
   * Fetch settings from API
   */
  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getSettings();
      setSettings(data);
      storedRef.current = data;
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Initial data fetch on mount
   */
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  /**
   * Warn before a reload or tab close throws away unsaved edits.
   *
   * Browsers ignore the custom message and show their own, which is the point:
   * without this, closing the tab silently discards a half-filled form.
   */
  useEffect(() => {
    if (!isDirty) return;

    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [isDirty]);

  // ============ Form Handlers ============

  /**
   * Handle input change
   * Updates settings state with changed value
   */
  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Number values
    if (name === 'featuredProductCount') {
      setSettings((prev) => ({ ...prev, [name]: parseInt(value, 10) || 8 }));
    }
    // String values
    else {
      setSettings((prev) => ({ ...prev, [name]: value }));
    }
  }, []);

  /**
   * Handle form save
   * Submits settings to API
   */
  const handleSave = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await api.updateSettings(settings as SiteSettings);
      // Only now is the form content the stored content. Doing this on success
      // rather than before the call is what keeps `isDirty` honest when the
      // write fails.
      storedRef.current = settings;
      showSuccess('Settings saved.');
    } catch (error) {
      console.error('Failed to save settings:', error);
      showError('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [settings, showSuccess, showError]);

  const discardChanges = useCallback(() => setSettings(storedRef.current), []);

  return {
    settings,
    loading,
    saving,
    activeTab,
    setActiveTab,
    handleChange,
    handleSave,
    setSettings,
    isDirty,
    discardChanges,
  };
}
