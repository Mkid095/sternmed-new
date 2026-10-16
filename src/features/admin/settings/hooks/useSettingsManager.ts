/**
 * useSettingsManager Hook
 *
 * Custom hook for managing site settings state and operations.
 * Handles data fetching, form changes, and save operations.
 *
 * @module useSettingsManager
 */

import React, { useState, useCallback, useEffect, FormEvent, ChangeEvent } from 'react';
import { api } from '../../../../services/api';
import { SiteSettings } from '../../../../types';
import { useToastSuccess, useToastError } from '../../../shared/ui';

/**
 * Settings tab type
 */
export type SettingsTab = 'general' | 'homepage' | 'legal';

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
  featuredSectionEnabled: true,
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

  // ============ Form Handlers ============

  /**
   * Handle input change
   * Updates settings state with changed value
   */
  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Handle boolean values for toggles
    if (name === 'featuredSectionEnabled') {
      setSettings((prev) => ({ ...prev, [name]: value === 'true' }));
    }
    // Handle number values
    else if (name === 'featuredProductCount') {
      setSettings((prev) => ({ ...prev, [name]: parseInt(value, 10) || 8 }));
    }
    // Handle string values
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
      showSuccess('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      showError('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [settings, showSuccess, showError]);

  return {
    settings,
    loading,
    saving,
    activeTab,
    setActiveTab,
    handleChange,
    handleSave,
    setSettings,
  };
}
