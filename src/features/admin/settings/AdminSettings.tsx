/**
 * Admin Settings Page
 *
 * Main site settings management interface for administrators.
 * Features include:
 * - General settings (phone, email, address, about)
 * - Home page prominence (featured products, category order)
 * - Legal pages (privacy policy, terms & conditions)
 * - Site status (development mode toggle)
 * - Tab-based navigation
 *
 * @module AdminSettings
 */

import React, { useEffect, useState } from 'react';
import { Settings, Save, Star, Globe, Lock, Unlock, AlertTriangle } from 'lucide-react';
import { Input } from '../../shared/ui';
import { Button } from '../../shared/ui';
import { useSettingsManager } from './hooks';
import { api } from '../../../services/api';
import { setDevelopmentMode as setDevMode, isDevelopmentMode as checkDevMode } from '../../../services/supabase/settings.service';
import { Category } from '../../../types';
import { useToastSuccess, useToastError } from '../../shared/ui';

/**
 * Admin Settings Page Component
 *
 * Provides site settings management:
 * - General settings (contact info, about text)
 * - Home page prominence (featured section, category order)
 * - Legal pages (privacy policy, terms & conditions)
 * - Site status (development mode toggle)
 * - Tab-based navigation between sections
 *
 * @example
 * <Route path="/admin/settings" element={<AdminSettings />} />
 */
export default function AdminSettings() {
  // ============ State Management ============

  const {
    settings,
    loading,
    saving,
    activeTab,
    setActiveTab,
    handleChange,
    handleSave,
  } = useSettingsManager();

  const [categories, setCategories] = useState<Category[]>([]);
  const [draggedCategory, setDraggedCategory] = useState<string | null>(null);
  const [devModeEnabled, setDevModeEnabled] = useState<boolean | null>(null);
  const [togglingMode, setTogglingMode] = useState(false);

  const showSuccess = useToastSuccess();
  const showError = useToastError();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const cats = await api.getCategories();
        setCategories(cats.filter((c) => c.showOnHome));
      } catch (error) {
        console.error('Failed to fetch categories', error);
      }
    };
    fetchCategories();

    const fetchDevMode = async () => {
      try {
        const devMode = await checkDevMode();
        setDevModeEnabled(devMode);
      } catch (error) {
        console.error('Failed to fetch development mode:', error);
        setDevModeEnabled(false);
      }
    };
    fetchDevMode();
  }, []);

  // ============ Loading State ============

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Loading settings...</div>
      </div>
    );
  }

  // ============ Main Layout ============

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <SettingsHeader />

      {/* Tabs */}
      <SettingsTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Settings Form */}
      <SettingsForm
        settings={settings}
        activeTab={activeTab}
        categories={categories}
        draggedCategory={draggedCategory}
        setDraggedCategory={setDraggedCategory}
        onChange={handleChange}
        onSave={handleSave}
        saving={saving}
        isDevelopmentMode={devModeEnabled}
        setIsDevelopmentMode={setDevModeEnabled}
        togglingMode={togglingMode}
        setTogglingMode={setTogglingMode}
      />
    </div>
  );
}

/**
 * Settings page header
 */
function SettingsHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
        <Settings size={20} className="sm:w-6 sm:h-6" />
        Site Settings
      </h2>
    </div>
  );
}

/**
 * Settings tab navigation
 */
interface SettingsTabsProps {
  activeTab: 'general' | 'homepage' | 'legal' | 'site-status';
  onTabChange: (tab: 'general' | 'homepage' | 'legal' | 'site-status') => void;
}

function SettingsTabs({ activeTab, onTabChange }: SettingsTabsProps) {
  return (
    <div className="border-b border-slate-200 overflow-x-auto">
      <nav className="flex gap-4 sm:gap-6 min-w-max">
        <TabButton
          tab="general"
          active={activeTab === 'general'}
          onClick={() => onTabChange('general')}
        >
          General
        </TabButton>
        <TabButton
          tab="homepage"
          active={activeTab === 'homepage'}
          onClick={() => onTabChange('homepage')}
        >
          Home Page
        </TabButton>
        <TabButton
          tab="legal"
          active={activeTab === 'legal'}
          onClick={() => onTabChange('legal')}
        >
          Legal Pages
        </TabButton>
        <TabButton
          tab="site-status"
          active={activeTab === 'site-status'}
          onClick={() => onTabChange('site-status')}
        >
          Site Status
        </TabButton>
      </nav>
    </div>
  );
}

/**
 * Individual tab button
 */
interface TabButtonProps {
  tab: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function TabButton({ tab, active, onClick, children }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
        active
          ? 'border-blue-600 text-blue-600'
          : 'border-transparent text-slate-500 hover:text-slate-700'
      }`}
      aria-selected={active}
      role="tab"
    >
      {children}
    </button>
  );
}

/**
 * Settings form with tab content
 */
interface SettingsFormProps {
  settings: Partial<{
    phoneNumber: string;
    email: string;
    address: string;
    aboutText: string;
    privacyPolicy: string;
    termsOfService: string;
    featuredSectionEnabled?: boolean;
    featuredProductCount?: number;
    prominentCategories?: string[];
  }>;
  activeTab: 'general' | 'homepage' | 'legal' | 'site-status';
  categories: Category[];
  draggedCategory: string | null;
  setDraggedCategory: (id: string | null) => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSave: (e: React.FormEvent) => Promise<void>;
  saving: boolean;
  isDevelopmentMode: boolean | null;
  setIsDevelopmentMode: (value: boolean) => void;
  togglingMode: boolean;
  setTogglingMode: (value: boolean) => void;
}

function SettingsForm({
  settings,
  activeTab,
  categories,
  draggedCategory,
  setDraggedCategory,
  onChange,
  onSave,
  saving,
  isDevelopmentMode,
  setIsDevelopmentMode,
  togglingMode,
  setTogglingMode,
}: SettingsFormProps) {
  const showSuccess = useToastSuccess();
  const showError = useToastError();

  const handleToggleDevMode = async () => {
    setTogglingMode(true);
    try {
      const newMode = !isDevelopmentMode;
      await setDevMode(newMode);
      setIsDevelopmentMode(newMode);
      showSuccess(`Website is now ${newMode ? 'in development mode' : 'live'}`);
    } catch (error) {
      console.error('Failed to toggle development mode:', error);
      showError('Failed to update site status. Please try again.');
    } finally {
      setTogglingMode(false);
    }
  };

  return (
    <form onSubmit={onSave}>
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden p-4 sm:p-6">
        {activeTab === 'site-status' ? (
          <SiteStatusSettings
            isDevelopmentMode={isDevelopmentMode}
            onToggle={handleToggleDevMode}
            togglingMode={togglingMode}
          />
        ) : activeTab === 'general' ? (
          <GeneralSettings settings={settings} onChange={onChange} />
        ) : activeTab === 'homepage' ? (
          <HomePageSettings
            settings={settings}
            categories={categories}
            draggedCategory={draggedCategory}
            setDraggedCategory={setDraggedCategory}
            onChange={onChange}
          />
        ) : (
          <LegalSettings settings={settings} onChange={onChange} />
        )}

        {/* Save Button - Hidden on site-status tab since it has its own controls */}
        {activeTab !== 'site-status' && (
          <div className="pt-4 border-t border-slate-200 flex justify-end">
            <Button type="submit" loading={saving} size="sm">
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        )}
      </div>
    </form>
  );
}

/**
 * Site Status settings - Development mode toggle
 */
interface SiteStatusSettingsProps {
  isDevelopmentMode: boolean | null;
  onToggle: () => void;
  togglingMode: boolean;
}

function SiteStatusSettings({ isDevelopmentMode, onToggle, togglingMode }: SiteStatusSettingsProps) {
  return (
    <div className="space-y-6">
      {/* Status Indicator */}
      <div className={`p-6 rounded-xl border-2 ${
        isDevelopmentMode
          ? 'bg-amber-50 border-amber-300'
          : 'bg-green-50 border-green-300'
      }`}>
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            isDevelopmentMode ? 'bg-amber-200' : 'bg-green-200'
          }`}>
            {isDevelopmentMode ? (
              <AlertTriangle className="w-6 h-6 text-amber-700" />
            ) : (
              <Globe className="w-6 h-6 text-green-700" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900 mb-1">
              {isDevelopmentMode ? 'Website Under Development' : 'Website Live'}
            </h3>
            <p className="text-sm text-slate-600">
              {isDevelopmentMode
                ? 'Visitors will see the "Under Development" page. Admin access remains available.'
                : 'Website is visible to all visitors. All pages are accessible.'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Current Mode Details */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
        <h4 className="font-semibold text-slate-900 mb-4">Current Mode</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Status</span>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              isDevelopmentMode
                ? 'bg-amber-100 text-amber-700'
                : 'bg-green-100 text-green-700'
            }`}>
              {isDevelopmentMode ? 'DEVELOPMENT' : 'LIVE'}
            </span>
          </div>

          {isDevelopmentMode && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Public Access</span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-200 text-slate-700">
                RESTRICTED
              </span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Admin Portal</span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
              AVAILABLE
            </span>
          </div>
        </div>
      </div>

      {/* Toggle Control - Prominent Button Design */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border-2 border-slate-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${
              isDevelopmentMode ? 'bg-gradient-to-br from-amber-400 to-amber-600' : 'bg-gradient-to-br from-green-400 to-green-600'
            }`}>
              {isDevelopmentMode ? (
                <Lock className="w-8 h-8 text-white" />
              ) : (
                <Unlock className="w-8 h-8 text-white" />
              )}
            </div>
            <div>
              <h4 className="text-lg font-bold text-slate-900 mb-1">
                {isDevelopmentMode ? 'Switch to Live Mode' : 'Switch to Development Mode'}
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                {isDevelopmentMode
                  ? 'Make your website publicly accessible to all visitors'
                  : 'Show the "Under Development" page to visitors while you work'
                }
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onToggle}
            disabled={togglingMode}
            className={`
              relative px-8 py-4 rounded-xl font-bold text-base shadow-lg
              transition-all duration-200 transform active:scale-95
              ${togglingMode ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-xl hover:-translate-y-0.5'}
              ${isDevelopmentMode
                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
                : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700'
              }
            `}
          >
            {togglingMode ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Switching...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                {isDevelopmentMode ? (
                  <>
                    <Globe className="w-5 h-5" />
                    Go Live
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    Enable Dev Mode
                  </>
                )}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Warning */}
      {isDevelopmentMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Development Mode Active</p>
              <p>
                While in development mode, visitors will see the "Website Under Development" page.
                Admins can still access the portal at{' '}
                <a href="/login" className="underline hover:text-blue-900">
                  /login
                </a>.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * General settings form fields
 */
interface GeneralSettingsProps {
  settings: Partial<{
    phoneNumber: string;
    email: string;
    address: string;
    aboutText: string;
  }>;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

function GeneralSettings({ settings, onChange }: GeneralSettingsProps) {
  return (
    <>
      {/* Contact Info Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <Input
          id="phoneNumber"
          name="phoneNumber"
          label="Phone Number"
          value={settings.phoneNumber || ''}
          onChange={onChange}
        />
        <Input
          id="email"
          name="email"
          type="email"
          label="Contact Email"
          value={settings.email || ''}
          onChange={onChange}
        />
      </div>

      {/* Physical Address */}
      <Input
        id="address"
        name="address"
        label="Physical Address"
        value={settings.address || ''}
        onChange={onChange}
      />

      {/* About Text */}
      <div>
        <label htmlFor="aboutText" className="block text-sm font-medium text-slate-700 mb-1">
          About Text (Footer)
        </label>
        <textarea
          id="aboutText"
          name="aboutText"
          rows={4}
          value={settings.aboutText || ''}
          onChange={onChange}
          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Brief description of your company for the footer..."
        />
      </div>
    </>
  );
}

/**
 * Home Page settings form fields
 */
interface HomePageSettingsProps {
  settings: Partial<{
    featuredSectionEnabled?: boolean;
    featuredProductCount?: number;
    prominentCategories?: string[];
  }>;
  categories: Category[];
  draggedCategory: string | null;
  setDraggedCategory: (id: string | null) => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

function HomePageSettings({
  settings,
  categories,
  draggedCategory,
  setDraggedCategory,
  onChange,
}: HomePageSettingsProps) {
  const handleToggleFeatured = () => {
    const event = {
      target: {
        name: 'featuredSectionEnabled',
        value: settings.featuredSectionEnabled ? 'false' : 'true',
      },
    } as React.ChangeEvent<HTMLInputElement>;
    onChange(event);
  };

  const handleFeaturedCountChange = (value: string) => {
    const event = {
      target: {
        name: 'featuredProductCount',
        value,
      },
    } as React.ChangeEvent<HTMLInputElement>;
    onChange(event);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedCategory(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    // This would update the order - for now just a visual indicator
    setDraggedCategory(null);
  };

  return (
    <div className="space-y-6">
      {/* Featured Section Toggle */}
      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <Star size={20} className="text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Featured Products Section</h3>
            <p className="text-sm text-slate-500">Show featured products on home page</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleToggleFeatured}
          className={`relative w-14 h-8 rounded-full transition-colors ${
            settings.featuredSectionEnabled !== false ? 'bg-blue-600' : 'bg-slate-300'
          }`}
        >
          <span
            className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
              settings.featuredSectionEnabled !== false ? 'translate-x-7' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Featured Product Count */}
      {settings.featuredSectionEnabled !== false && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Number of Featured Products
          </label>
          <Input
            type="number"
            id="featuredProductCount"
            name="featuredProductCount"
            value={settings.featuredProductCount || 4}
            onChange={(e) => handleFeaturedCountChange(e.target.value)}
            min={1}
            max={12}
          />
          <p className="text-xs text-slate-500 mt-1">
            Number of products to display in the featured section (1-12)
          </p>
        </div>
      )}

      {/* Category Order */}
      <div>
        <h3 className="text-sm font-medium text-slate-700 mb-3">
          Category Display Order (Home Page)
        </h3>
        <p className="text-xs text-slate-500 mb-3">
          Drag to reorder categories shown on the home page
        </p>
        <div className="space-y-2">
          {categories.map((category, index) => (
            <div
              key={category.id}
              draggable
              onDragStart={(e) => handleDragStart(e, category.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, category.id)}
              className={`flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg cursor-move transition-colors ${
                draggedCategory === category.id ? 'opacity-50' : 'hover:bg-slate-50'
              }`}
            >
              <div className="cursor-move text-slate-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                </svg>
              </div>
              <span className="flex-1 text-sm text-slate-700">{category.name}</span>
              <span className="text-xs text-slate-400">#{index + 1}</span>
            </div>
          ))}
          {categories.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-4">
              No categories set to show on home page. Enable "Show on Home" in category settings.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Legal pages settings form fields
 */
interface LegalSettingsProps {
  settings: Partial<{
    privacyPolicy: string;
    termsOfService: string;
  }>;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

function LegalSettings({ settings, onChange }: LegalSettingsProps) {
  return (
    <div className="space-y-6">
      {/* Privacy Policy */}
      <div>
        <label htmlFor="privacyPolicy" className="block text-sm font-medium text-slate-700 mb-2">
          Privacy Policy Content
        </label>
        <textarea
          id="privacyPolicy"
          name="privacyPolicy"
          rows={8}
          value={settings.privacyPolicy || ''}
          onChange={onChange}
          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-mono text-xs"
          placeholder="Enter your privacy policy content..."
        />
      </div>

      {/* Terms of Service */}
      <div>
        <label htmlFor="termsOfService" className="block text-sm font-medium text-slate-700 mb-2">
          Terms & Conditions Content
        </label>
        <textarea
          id="termsOfService"
          name="termsOfService"
          rows={8}
          value={settings.termsOfService || ''}
          onChange={onChange}
          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-mono text-xs"
          placeholder="Enter your terms and conditions content..."
        />
      </div>
    </div>
  );
}
