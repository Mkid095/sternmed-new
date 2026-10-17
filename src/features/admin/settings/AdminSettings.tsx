/**
 * Admin Settings page.
 *
 * Four tabs, each owning a different kind of fact:
 *
 * | Tab          | Owns                                                        |
 * |--------------|-------------------------------------------------------------|
 * | General      | Contact details and the footer blurb                        |
 * | Home Page    | Featured product count, category display order              |
 * | Legal Pages  | Privacy policy and terms text                               |
 * | Site Status  | Development mode — saved the moment it is flipped, not here |
 *
 * The home page *layout* is not in that list. It belongs to the Landing page
 * (`../../landing/hooks/useHomeSections`), which is where the blocks, their
 * order and their switches live. Settings used to render a second copy of that
 * list; two writers for one fact is what made a change made on one page appear
 * to do nothing on the other. There is now a pointer instead of a duplicate.
 *
 * Design notes
 * ------------
 * This page was previously styled differently from the rest of the admin app —
 * gradient tiles, a 16-button gradient call to action, a status card that
 * restated the banner above it, and blue where the rest of the app is
 * `primary`. It is now flat white cards on slate, matching every other admin
 * screen, and uses the shared `Toggle` for the one live switch.
 *
 * @module AdminSettings
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Settings,
  Save,
  Star,
  Globe,
  AlertTriangle,
  LayoutTemplate,
  Package,
  GripVertical,
  ExternalLink,
  Mail,
  MapPin,
  FileText,
  Power,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Input, Textarea, Toggle } from '../../shared/ui';
import { useSettingsManager, type SettingsTab } from './hooks';
import { api } from '../../../services/api';
import {
  setDevelopmentMode as setDevMode,
  isDevelopmentMode as checkDevMode,
} from '../../../services/siteSettings.service';
import { Category, SiteSettings } from '../../../types';
import { useToastSuccess, useToastError } from '../../shared/ui';

/* ------------------------------------------------------------------ *
 * Shared field styling
 * ------------------------------------------------------------------ */

const LABEL = 'mb-1.5 block text-sm font-medium text-slate-700';

/* ------------------------------------------------------------------ *
 * Page
 * ------------------------------------------------------------------ */

export default function AdminSettings() {
  const {
    settings,
    setSettings,
    loading,
    saving,
    activeTab,
    setActiveTab,
    handleChange,
    handleSave,
    isDirty,
    discardChanges,
  } = useSettingsManager();

  const [categories, setCategories] = useState<Category[]>([]);
  const [draggedCategory, setDraggedCategory] = useState<string | null>(null);
  const [devModeEnabled, setDevModeEnabled] = useState<boolean | null>(null);
  const [togglingMode, setTogglingMode] = useState(false);

  useEffect(() => {
    api
      .getCategories()
      .then((cats) => setCategories(cats.filter((c) => c.showOnHome)))
      .catch((error) => console.error('Failed to fetch categories', error));
  }, []);

  useEffect(() => {
    checkDevMode()
      .then(setDevModeEnabled)
      .catch((error) => {
        console.error('Failed to fetch development mode:', error);
        setDevModeEnabled(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-500">
        Loading settings…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="flex items-center gap-2.5 text-xl font-bold text-slate-900">
          <Settings size={20} className="text-slate-400" aria-hidden="true" />
          Site Settings
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Contact details, home page behaviour and legal text. Changes are saved
          when you press Save.
        </p>
      </header>

      <SettingsTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/*
        The tabpanel wraps the real content rather than living inside
        SettingsTabs — `aria-controls` on the tab has to point at the thing the
        tab actually controls, or a screen reader announces a panel that is not
        there.
      */}
      <div
        id={`settings-panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`settings-tab-${activeTab}`}
        tabIndex={-1}
        className="pt-5 focus-visible:outline-none"
      >
      {/*
        `site-status` sits outside the form: it flips a live flag that takes
        effect the moment it is toggled, so it must not queue behind Save.
      */}
      {activeTab === 'site-status' ? (
        <SiteStatusPanel
          isDevelopmentMode={devModeEnabled}
          onToggle={setDevModeEnabled}
          togglingMode={togglingMode}
          setTogglingMode={setTogglingMode}
        />
      ) : (
        <form onSubmit={handleSave} className="space-y-5">
          {activeTab === 'general' && (
            <GeneralSettings settings={settings} onChange={handleChange} />
          )}

          {activeTab === 'homepage' && (
            <HomePageSettings
              settings={settings}
              categories={categories}
              draggedCategory={draggedCategory}
              setDraggedCategory={setDraggedCategory}
              onChange={handleChange}
              setSettings={setSettings}
            />
          )}

          {activeTab === 'legal' && <LegalSettings settings={settings} onChange={handleChange} />}

          {/*
            The bar is only there when there is something to save. A permanently
            visible Save button reads as equally urgent whether or not anything
            has changed, and there is no way to tell whether your last edit
            landed.
          */}
          <div
            className={clsx(
              // Clears the mobile bottom nav (65px) so the bar is never parked
              // underneath it; on sm up there is no nav and it sits near the edge.
              'sticky bottom-[5.5rem] z-20 flex flex-col gap-3 rounded-xl sm:bottom-4',
              'sm:flex-row sm:items-center sm:justify-between sm:gap-4',
              'border border-slate-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur',
              'transition-opacity duration-150',
              isDirty ? 'opacity-100' : 'pointer-events-none opacity-0',
            )}
          >
            <p className="text-sm text-slate-600">You have unsaved changes.</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={discardChanges}
                disabled={saving}
                className="flex-1 whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50 sm:flex-none"
              >
                Discard
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
              >
                <Save size={15} aria-hidden="true" />
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        </form>
      )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Tabs
 * ------------------------------------------------------------------ */

const TABS: { id: SettingsTab; label: string; description: string }[] = [
  {
    id: 'general',
    label: 'General',
    description: 'How customers reach you, and what the footer says about you.',
  },
  {
    id: 'homepage',
    label: 'Home Page',
    description: 'How many featured products show, and the order of the categories.',
  },
  {
    id: 'legal',
    label: 'Legal Pages',
    description: 'The text behind the Privacy Policy and Terms links in the footer.',
  },
  {
    id: 'site-status',
    label: 'Site Status',
    description: 'Take the public site offline while you work, or put it back live.',
  },
];

interface SettingsTabsProps {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
}

function SettingsTabs({ activeTab, onTabChange }: SettingsTabsProps) {
  // Arrow-key movement is what the tablist pattern requires, and it is what a
  // keyboard user expects once the control announces itself as tabs.
  const listRef = useRef<HTMLDivElement>(null);
  const active = TABS.find((t) => t.id === activeTab) ?? TABS[0];

  const onKeyDown = (e: React.KeyboardEvent) => {
    const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (delta === 0) return;

    e.preventDefault();
    const index = TABS.findIndex((t) => t.id === activeTab);
    const next = TABS[(index + delta + TABS.length) % TABS.length];
    onTabChange(next.id);
    listRef.current
      ?.querySelector<HTMLButtonElement>(`#settings-tab-${next.id}`)
      ?.focus();
  };

  return (
    <div>
      <div
        ref={listRef}
        role="tablist"
        aria-label="Settings sections"
        onKeyDown={onKeyDown}
        // The strip scrolls sideways on narrow screens. Its scrollbar is hidden
        // because a visible one under the tabs reads as page content.
        className="flex gap-1 overflow-x-auto border-b border-slate-200 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {TABS.map((tab) => {
          const selected = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              id={`settings-tab-${tab.id}`}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls={`settings-panel-${activeTab}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => onTabChange(tab.id)}
              className={clsx(
                'shrink-0 border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors',
                selected
                  ? 'border-primary-600 text-primary-700'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700',
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Each tab explains itself, so the panel below is not a bare list of fields. */}
      <p className="pt-5 text-sm text-slate-500">{active.description}</p>
    </div>
  );
}

/**
 * A titled group of fields. Used instead of free-floating labels so each tab
 * reads as a short list of named sections rather than one long wall of inputs.
 */
function Section({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <span className="text-slate-400" aria-hidden="true">
            {icon}
          </span>
          {title}
        </h2>
        {description && <p className="mt-1 text-xs text-slate-500">{description}</p>}
      </div>
      <div className="space-y-4 px-5 py-5">{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * General
 * ------------------------------------------------------------------ */

interface GeneralSettingsProps {
  settings: Partial<SiteSettings>;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

function GeneralSettings({ settings, onChange }: GeneralSettingsProps) {
  return (
    <div className="space-y-5">
      <Section
        icon={<Mail size={16} />}
        title="Contact"
        description="Shown in the site header, the footer and on the contact buttons."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={LABEL} htmlFor="phoneNumber">
              Phone number
            </label>
            <Input
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              value={settings.phoneNumber || ''}
              onChange={onChange}
              placeholder="+254 799 526972"
            />
          </div>

          <div>
            <label className={LABEL} htmlFor="email">
              Contact email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              value={settings.email || ''}
              onChange={onChange}
              placeholder="info@sternmedafrika.com"
            />
          </div>
        </div>

        <div>
          <label className={LABEL} htmlFor="whatsappNumber">
            WhatsApp number
          </label>
          <Input
            id="whatsappNumber"
            name="whatsappNumber"
            type="tel"
            value={settings.whatsappNumber || ''}
            onChange={onChange}
            placeholder={settings.phoneNumber || '254799526972'}
            helperText="Enquiry buttons and checkout send customers here via wa.me. Leave blank to use the phone number above. Include the country code."
          />
        </div>
      </Section>

      <Section
        icon={<MapPin size={16} />}
        title="Address"
        description="Shown in the footer."
      >
        <div>
          <label className={LABEL} htmlFor="address">
            Physical address
          </label>
          <Input
            id="address"
            name="address"
            value={settings.address || ''}
            onChange={onChange}
            placeholder="Nairobi, Kenya"
          />
        </div>
      </Section>

      <Section
        icon={<FileText size={16} />}
        title="About"
        description="A short description shown in the footer on every page."
      >
        <div>
          <label className={LABEL} htmlFor="aboutText">
            About text
          </label>
          <Textarea
            id="aboutText"
            name="aboutText"
            rows={3}
            value={settings.aboutText || ''}
            onChange={onChange}
            placeholder="Brief description of your company for the footer…"
          />
        </div>
      </Section>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Home Page
 * ------------------------------------------------------------------ */

interface HomePageSettingsProps {
  settings: Partial<SiteSettings>;
  categories: Category[];
  draggedCategory: string | null;
  setDraggedCategory: (id: string | null) => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  setSettings: React.Dispatch<React.SetStateAction<Partial<SiteSettings>>>;
}

function HomePageSettings({
  settings,
  categories,
  draggedCategory,
  setDraggedCategory,
  onChange,
  setSettings,
}: HomePageSettingsProps) {
  const getOrderedCategories = (): Category[] => {
    if (!settings.prominentCategories || settings.prominentCategories.length === 0) {
      return [...categories].sort((a, b) => a.name.localeCompare(b.name));
    }
    const categoryMap = new Map(categories.map((c) => [c.id, c] as const));
    const ordered: Category[] = [];
    for (const id of settings.prominentCategories) {
      const cat = categoryMap.get(id);
      if (cat) {
        ordered.push(cat);
        categoryMap.delete(id);
      }
    }
    ordered.push(...categoryMap.values());
    return ordered;
  };
  const sortedCategories = getOrderedCategories();

  const handleCategoryDragStart = (e: React.DragEvent, id: string) => {
    setDraggedCategory(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleCategoryDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleCategoryDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const draggedId = draggedCategory;
    if (!draggedId) return;

    const currentOrder =
      settings.prominentCategories && settings.prominentCategories.length > 0
        ? settings.prominentCategories
        : sortedCategories.map((c) => c.id);

    const draggedIndex = currentOrder.indexOf(draggedId);
    const targetIndex = currentOrder.indexOf(targetId);

    if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) {
      setDraggedCategory(null);
      return;
    }

    const newOrder = [...currentOrder];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedId);

    setSettings((prev) => ({ ...prev, prominentCategories: newOrder }));

    // Also persist to categories.order so the rendered order matches
    try {
      const categoryOrders = newOrder
        .filter((id) => categories.some((c) => c.id === id))
        .map((id, index) => ({ id, order: index }));
      await api.reorderCategories(categoryOrders);
    } catch (error) {
      console.error('Failed to sync category order:', error);
    }

    setDraggedCategory(null);
  };

  return (
    <div className="space-y-5">
      {/* ---------------- Layout: owned by the Landing page ---------------- */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <LayoutTemplate size={18} className="mt-0.5 flex-shrink-0 text-slate-400" aria-hidden="true" />
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Page layout</h2>
            <p className="mt-1 max-w-md text-xs leading-relaxed text-slate-500">
              Which blocks the home page shows — hero, featured products, categories
              and your call-to-action banners — and the order they appear in is set on
              the Landing page.
            </p>
          </div>
        </div>
        <a
          href="/admin/landing-config"
          className="inline-flex flex-shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          <ExternalLink size={14} aria-hidden="true" />
          Open Landing page
        </a>
      </div>

      {/* ---------------- Featured products ---------------- */}
      <Section
        icon={<Star size={16} />}
        title="Featured products"
        description="How many products the featured row shows."
      >
        <div className="flex items-center gap-3">
          {/*
            Input hardcodes `w-full` on both its wrapper and its control, and a
            same-utility `className` override loses on cascade order — so the
            width is constrained on a wrapper instead of on the control.
          */}
          <div className="w-28 flex-shrink-0">
            <Input
              id="featuredProductCount"
              name="featuredProductCount"
              type="number"
              min={1}
              max={20}
              value={settings.featuredProductCount ?? 8}
              onChange={onChange}
            />
          </div>
          <span className="text-xs text-slate-500">between 1 and 20</span>
        </div>
      </Section>

      {/* ---------------- Category order ---------------- */}
      <Section
        icon={<Package size={16} />}
        title="Category order"
        description="The order categories appear in the shop-by-category strips on the home page."
      >
        {sortedCategories.length > 0 ? (
          <ul className="space-y-2">
            {sortedCategories.map((category, index) => (
              <li
                key={category.id}
                draggable
                onDragStart={(e) => handleCategoryDragStart(e, category.id)}
                onDragOver={handleCategoryDragOver}
                onDrop={(e) => handleCategoryDrop(e, category.id)}
                className={clsx(
                  'flex cursor-move items-center gap-3 rounded-lg border bg-white px-3 py-2.5 transition-colors',
                  draggedCategory === category.id
                    ? 'border-primary-300 opacity-50'
                    : 'border-slate-200 hover:border-slate-300',
                )}
              >
                <GripVertical size={16} className="flex-shrink-0 text-slate-300" aria-hidden="true" />
                {category.image && (
                  <img
                    src={category.image}
                    alt=""
                    className="h-7 w-7 flex-shrink-0 rounded object-cover"
                    referrerPolicy="no-referrer"
                  />
                )}
                <span className="min-w-0 flex-1 truncate text-sm text-slate-700">
                  {category.name}
                </span>
                <span className="flex-shrink-0 text-xs tabular-nums text-slate-400">
                  {index + 1}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-lg bg-slate-50 px-4 py-6 text-center">
            <Package size={24} className="mx-auto mb-2 text-slate-300" aria-hidden="true" />
            <p className="text-sm text-slate-600">No categories are set to show on the home page.</p>
            <p className="mt-1 text-xs text-slate-500">
              Turn on &ldquo;Show on home&rdquo; for a category on the Categories page and it
              will appear here.
            </p>
          </div>
        )}
      </Section>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Legal
 * ------------------------------------------------------------------ */

interface LegalSettingsProps {
  settings: Partial<SiteSettings>;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

/**
 * One legal document field.
 *
 * Each carries the live link it feeds, a note on the accepted format, and a
 * character count — the three things that were missing, which is why the two
 * empty boxes looked like a broken form rather than unfinished content.
 */
function LegalField({
  id,
  name,
  label,
  description,
  href,
  value,
  onChange,
}: {
  id: string;
  name: string;
  label: string;
  description: string;
  href: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}) {
  const empty = value.trim().length === 0;

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label className={clsx(LABEL, 'mb-0')} htmlFor={id}>
          {label}
        </label>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex flex-shrink-0 items-center gap-1 text-xs text-primary-600 hover:text-primary-700"
        >
          View page
          <ExternalLink size={12} aria-hidden="true" />
        </a>
      </div>

      <Textarea
        id={id}
        name={name}
        rows={10}
        value={value}
        onChange={onChange}
        placeholder={`Paste the ${label.toLowerCase()} text here…`}
      />

      <div className="mt-1.5 flex items-center justify-between gap-3">
        <p className="text-xs text-slate-500">{description}</p>
        <p className={clsx('flex-shrink-0 text-xs', empty ? 'text-amber-600' : 'text-slate-400')}>
          {empty ? 'Empty' : `${value.length.toLocaleString()} characters`}
        </p>
      </div>
    </div>
  );
}

function LegalSettings({ settings, onChange }: LegalSettingsProps) {
  const privacy = settings.privacyPolicy ?? '';
  const terms = settings.termsOfService ?? '';
  const bothEmpty = privacy.trim() === '' && terms.trim() === '';

  return (
    <div className="space-y-5">
      {bothEmpty && (
        <p className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
          <span>
            Both documents are empty, but the footer still links to them. Until you fill
            these in, those links lead to a blank page.
          </span>
        </p>
      )}

      <Section
        icon={<FileText size={16} />}
        title="Legal documents"
        description="Plain text or simple HTML. Basic tags like <p>, <strong> and <ul> are rendered."
      >
        <LegalField
          id="privacyPolicy"
          name="privacyPolicy"
          label="Privacy policy"
          description="Shown at the Privacy Policy link in the footer."
          href="/privacy-policy"
          value={privacy}
          onChange={onChange}
        />

        <div className="border-t border-slate-100" />

        <LegalField
          id="termsOfService"
          name="termsOfService"
          label="Terms & conditions"
          description="Shown at the Terms & Conditions link in the footer."
          href="/terms"
          value={terms}
          onChange={onChange}
        />
      </Section>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Site Status
 * ------------------------------------------------------------------ */

interface SiteStatusPanelProps {
  isDevelopmentMode: boolean | null;
  onToggle: (value: boolean) => void;
  togglingMode: boolean;
  setTogglingMode: (value: boolean) => void;
}

/**
 * Development mode.
 *
 * This is the only setting on the page that takes effect immediately rather
 * than on Save — it has to, because it is the control an admin reaches for
 * precisely when they cannot wait for a save round trip. It says so.
 *
 * Flat on purpose. The previous version had a gradient status banner, a second
 * card restating the same status, and a large gradient call to action, for one
 * boolean.
 */
function SiteStatusPanel({
  isDevelopmentMode,
  onToggle,
  togglingMode,
  setTogglingMode,
}: SiteStatusPanelProps) {
  const showSuccess = useToastSuccess();
  const showError = useToastError();

  const handleToggle = async (next: boolean) => {
    setTogglingMode(true);
    try {
      await setDevMode(next);
      onToggle(next);
      showSuccess(next ? 'Site is now in development mode.' : 'Site is live.');
    } catch (error) {
      console.error('Failed to toggle development mode:', error);
      showError('Failed to change the site status. Please try again.');
    } finally {
      setTogglingMode(false);
    }
  };

  const status = (isDevelopmentMode === null
    ? { dot: 'bg-slate-400', text: 'Checking…' }
    : isDevelopmentMode
      ? { dot: 'bg-amber-500', text: 'Development mode' }
      : { dot: 'bg-emerald-500', text: 'Live' }
  );

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-1.5 flex h-2.5 w-2.5 flex-shrink-0" aria-hidden="true">
              <span className={clsx('h-full w-full rounded-full', status.dot)} />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                The website is {isDevelopmentMode ? 'hidden from visitors' : 'live'}
              </h2>
              <p className="mt-1 max-w-md text-xs leading-relaxed text-slate-500">
                {isDevelopmentMode
                  ? 'Visitors see an "under development" page. The admin portal still works, so you can keep editing.'
                  : 'Every page is reachable by the public. This is the normal state for a running site.'}
              </p>
            </div>
          </div>

          <Toggle
            checked={isDevelopmentMode === true}
            onCheckedChange={handleToggle}
            disabled={isDevelopmentMode === null || togglingMode}
            label="Development mode"
            className="flex-shrink-0"
          />
        </div>

        <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
          This takes effect immediately — there is nothing to save.
        </p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white px-5 py-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Power size={16} className="text-slate-400" aria-hidden="true" />
          What each mode means
        </h2>

        <dl className="mt-4 divide-y divide-slate-100">
          <div className="flex gap-4 py-3 first:pt-0">
            <dt className="w-32 flex-shrink-0 text-sm font-medium text-slate-700">Public visitors</dt>
            <dd className="text-sm text-slate-500">
              {isDevelopmentMode
                ? 'An "under development" notice.'
                : 'The full site, every page.'}
            </dd>
          </div>
          <div className="flex gap-4 py-3">
            <dt className="w-32 flex-shrink-0 text-sm font-medium text-slate-700">Admin portal</dt>
            <dd className="text-sm text-slate-500">
              Always available. Sign in at <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">/login</code>.
            </dd>
          </div>
          <div className="flex gap-4 py-3 last:pb-0">
            <dt className="w-32 flex-shrink-0 text-sm font-medium text-slate-700">Search engines</dt>
            <dd className="text-sm text-slate-500">
              {isDevelopmentMode
                ? 'The site may drop out of search results while it is hidden.'
                : 'Indexed as normal.'}
            </dd>
          </div>
        </dl>
      </section>

      {isDevelopmentMode && (
        <p className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <Globe size={16} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
          <span>
            Visitors cannot buy from you right now. Products and orders still work from
            the admin portal.
          </span>
        </p>
      )}
    </div>
  );
}