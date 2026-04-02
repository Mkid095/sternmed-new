/**
 * useLandingConfig Hook
 *
 * Custom hook for managing landing page configuration.
 * Handles category visibility toggle on home page.
 *
 * @module useLandingConfig
 */

import { useState, useCallback, useEffect } from 'react';
import { api } from '../../../../services/api';
import { Category } from '../../../../types';

/**
 * Return type for useLandingConfig hook
 */
export interface UseLandingConfigReturn {
  /** All categories */
  categories: Category[];

  /** Whether data is loading */
  loading: boolean;

  /** Toggle category visibility on home page */
  toggleShowOnHome: (id: string, currentStatus: boolean) => Promise<void>;

  /** Refresh categories from API */
  refreshCategories: () => Promise<void>;
}

/**
 * Custom hook for landing page configuration management
 *
 * Provides state management for landing page config:
 * - Fetches categories from API
 * - Handles toggle of showOnHome status
 *
 * @returns Categories state and handlers
 *
 * @example
 * function AdminLandingConfig() {
 *   const { categories, loading, toggleShowOnHome } = useLandingConfig();
 *
 *   return <LandingConfigPage {...} />;
 * }
 */
export function useLandingConfig(): UseLandingConfigReturn {
  // ============ State ============

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // ============ Data Fetching ============

  /**
   * Fetch categories from API
   */
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Initial data fetch on mount
   */
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  /**
   * Refresh categories (alias for fetchCategories)
   */
  const refreshCategories = fetchCategories;

  // ============ Handlers ============

  /**
   * Toggle category visibility on home page
   */
  const toggleShowOnHome = useCallback(async (id: string, currentStatus: boolean) => {
    try {
      await api.updateCategory(id, { showOnHome: !currentStatus });
      await fetchCategories();
    } catch (error) {
      console.error('Failed to toggle category visibility:', error);
    }
  }, [fetchCategories]);

  return {
    categories,
    loading,
    toggleShowOnHome,
    refreshCategories,
  };
}
