/**
 * Home page section state.
 *
 * The landing page owns `settings.homepageSections` — which blocks the home
 * page is made of, in what order, and which are switched on.
 *
 * Why this page owns it
 * ---------------------
 * It used to be editable from two places at once: the landing page wrote
 * `categories.show_on_home`, and Settings → Home wrote `homepage_sections`.
 * Both pages also wrote the category ORDER, so the two silently disagreed and
 * a change made in one appeared to do nothing in the other — the "looking in
 * circles" behaviour.
 *
 * Now each fact has exactly one home:
 *
 * | Fact                        | Owner                        |
 * |-----------------------------|------------------------------|
 * | Which blocks the page shows | this page                    |
 * | Their order                 | this page                    |
 * | Whether a category is shown | Categories page              |
 * | Category display order      | Settings → Home              |
 * | How many featured products  | Settings → Home              |
 *
 * @module useHomeSections
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../../../services/api';
import {
  DEFAULT_HOMEPAGE_SECTIONS,
  type CtaBannerConfig,
  type HomepageSection,
} from '../../../../types';

/** Human labels, kept beside the hook so the row component stays presentational. */
export const SECTION_META: Record<
  string,
  { label: string; description: string; iconName: 'hero' | 'featured' | 'categories' | 'promo' }
> = {
  hero: {
    label: 'Hero banner',
    description: 'The carousel of live banners at the very top of the page',
    iconName: 'hero',
  },
  'featured-products': {
    label: 'Featured products',
    description: 'A row of promoted products',
    iconName: 'featured',
  },
  categories: {
    label: 'Shop by category',
    description: 'One product strip per category marked for the home page',
    iconName: 'categories',
  },
  'cta-banner': {
    label: 'Call to action banner',
    description: 'A promotional flyer you added, in page order',
    iconName: 'promo',
  },
  'promotional-banner': {
    label: 'Promotional banner',
    description: 'Not built yet — switching it on shows nothing for now',
    iconName: 'promo',
  },
};

/** Section types the admin can add more than once. */
export const ADDABLE_TYPES = ['cta-banner'] as const;

export interface UseHomeSectionsReturn {
  sections: HomepageSection[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  setEnabled: (id: string, enabled: boolean) => Promise<void>;
  move: (id: string, direction: -1 | 1) => Promise<void>;
  reorder: (orderedIds: string[]) => Promise<void>;
  addSection: (type: string) => Promise<HomepageSection | null>;
  updateConfig: (id: string, config: Record<string, unknown>) => Promise<void>;
  removeSection: (id: string) => Promise<void>;
}

export function useHomeSections(): UseHomeSectionsReturn {
  const [sections, setSections] = useState<HomepageSection[]>(DEFAULT_HOMEPAGE_SECTIONS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const settings = await api.getSettings();
        if (cancelled) return;

        const stored = settings.homepageSections;
        if (!Array.isArray(stored) || stored.length === 0) return;

        // Merge onto the defaults rather than trusting the stored array alone:
        // a section added in a later release would otherwise be invisible and
        // impossible to switch on.
        const byId = new Map<string, HomepageSection>(stored.map((s) => [s.id, s] as const));

        // Start from the defaults, so a section added in a later release is
        // visible and switchable rather than missing entirely.
        const merged = DEFAULT_HOMEPAGE_SECTIONS.map((fallback, index) => {
          const found = byId.get(fallback.id);
          if (found) byId.delete(fallback.id);
          return found
            ? { ...fallback, ...found, position: found.position ?? index }
            : { ...fallback, position: index };
        });

        // Anything left in `byId` is an admin-added section — call-to-action
        // banners have random ids, so there is no default to fold them into.
        // Dropping them here is what silently deleted every one of them on save.
        merged.push(...byId.values());

        setSections(merged.sort((a, b) => a.position - b.position));
      } catch (err) {
        console.error('Failed to load home page sections:', err);
        if (!cancelled) setError('Could not load the home page layout.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  /**
   * Persists and only then updates local state, so what you see is what was
   * saved. On failure the previous value is restored and the error surfaced —
   * a toggle that silently snaps back reads as a broken control.
   */
  const persist = useCallback(
    async (next: HomepageSection[]): Promise<boolean> => {
      const previous = sections;
      setSaving(true);
      setError(null);
      setSections(next);
      try {
        await api.updateSettings({ homepageSections: next });
        return true;
      } catch (err) {
        console.error('Failed to save home page sections:', err);
        setSections(previous);
        setError('Could not save. Your change was not applied.');
        return false;
      } finally {
        setSaving(false);
      }
    },
    [sections],
  );

  const setEnabled = useCallback(
    (id: string, enabled: boolean) =>
      persist(sections.map((s) => (s.id === id ? { ...s, enabled } : s))),
    [persist, sections],
  );

  /** Reorders and renumbers, since `position` is what the home page sorts on. */
  const reorder = useCallback(
    async (orderedIds: string[]) => {
      const byId = new Map<string, HomepageSection>(sections.map((s) => [s.id, s] as const));
      const next = orderedIds
        .map((id, index) => {
          const found = byId.get(id);
          return found ? { ...found, position: index } : undefined;
        })
        .filter((s): s is HomepageSection => s !== undefined);
      await persist(next);
    },
    [persist, sections],
  );

  const move = useCallback(
    (id: string, direction: -1 | 1) => {
      const ids = sections.map((s) => s.id);
      const from = ids.indexOf(id);
      const to = from + direction;
      if (from === -1 || to < 0 || to >= ids.length) return Promise.resolve();
      const next = [...ids];
      [next[from], next[to]] = [next[to], next[from]];
      return reorder(next);
    },
    [reorder, sections],
  );

  /**
   * Adds a section at the end of the list and returns it so the caller can open
   * its editor immediately. Returns null on failure rather than throwing,
   * because `persist` already surfaces the error and rolls back.
   */
  const addSection = useCallback(
    async (type: string): Promise<HomepageSection | null> => {
      const created: HomepageSection = {
        id: crypto.randomUUID(),
        type,
        enabled: true,
        position: sections.length,
        config: {},
      };
      const added = await persist([...sections, created]);
      return added ? created : null;
    },
    [persist, sections],
  );

  /**
   * Replaces a section's config outright rather than merging into it.
   *
   * A merge cannot express "remove this key", so clearing the category a
   * banner is pinned to would have silently kept the old value and left it
   * stuck in place. The editor always sends the complete config, and it is the
   * only caller, so replacing is both correct and easier to reason about.
   */
  const updateConfig = useCallback(
    (id: string, config: Record<string, unknown>) =>
      persist(sections.map((s) => (s.id === id ? { ...s, config } : s))),
    [persist, sections],
  );

  const removeSection = useCallback(
    (id: string) => persist(sections.filter((s) => s.id !== id)),
    [persist, sections],
  );

  const sorted = useMemo(
    () => [...sections].sort((a, b) => a.position - b.position),
    [sections],
  );

  return {
    sections: sorted,
    loading,
    saving,
    error,
    setEnabled,
    move,
    reorder,
    addSection,
    updateConfig,
    removeSection,
  };
}