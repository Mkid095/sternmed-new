/**
 * useAdminList Hook
 *
 * Custom hook for managing admin list pages with common patterns:
 * - Data fetching with loading state
 * - Error handling
 * - Search/filter functionality
 * - Delete operations with confirmation
 *
 * Reduces duplicate code across admin pages.
 *
 * @module useAdminList
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * Generic item type for admin lists
 */
export interface AdminListItem {
  id: string;
}

/**
 * Configuration options for useAdminList hook
 */
export interface UseAdminListOptions<T extends AdminListItem> {
  /** Function to fetch all items from the API */
  fetchItems: () => Promise<T[]>;

  /** Function to delete a single item */
  deleteItem?: (id: string) => Promise<void>;

  /** Whether to enable delete functionality */
  enableDelete?: boolean;

  /** Auto-fetch on mount */
  autoFetch?: boolean;
}

/**
 * Return type for useAdminList hook
 */
export interface UseAdminListReturn<T extends AdminListItem> {
  /** The list of items */
  items: T[];

  /** Whether data is currently loading */
  isLoading: boolean;

  /** Error message if fetch failed */
  error: string | null;

  /** Search query string */
  searchQuery: string;

  /** Update the search query */
  setSearchQuery: (query: string) => void;

  /** Refresh/re-fetch the items list */
  refresh: () => Promise<void>;

  /** Handle delete with simple confirmation */
  handleDelete: (id: string) => Promise<void>;
}

/**
 * Custom hook for admin list pages
 *
 * Handles common patterns for admin list pages:
 * - Fetching data with loading/error states
 * - Search functionality
 * - Delete with confirmation dialog
 *
 * @param options - Configuration options
 * @returns Object with list state and handlers
 *
 * @example
 * function AdminProducts() {
 *   const {
 *     items,
 *     isLoading,
 *     searchQuery,
 *     setSearchQuery,
 *     refresh,
 *     handleDelete
 *   } = useAdminList({
 *     fetchItems: api.getProducts,
 *     deleteItem: api.deleteProduct,
 *     enableDelete: true,
 *     autoFetch: true,
 *   });
 *
 *   return <ProductList items={items} onDelete={handleDelete} />;
 * }
 */
export function useAdminList<T extends AdminListItem>(
  options: UseAdminListOptions<T>
): UseAdminListReturn<T> {
  const {
    fetchItems,
    deleteItem,
    enableDelete = true,
    autoFetch = true,
  } = options;

  // ============ State ============

  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // ============ Data Fetching ============

  /**
   * Fetch items from the API
   */
  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchItems();
      setItems(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      setError(errorMessage);
      console.error('Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [fetchItems]);

  /**
   * Auto-fetch on mount
   */
  useEffect(() => {
    if (autoFetch) {
      refresh();
    }
  }, [autoFetch, refresh]);

  // ============ Delete Handler ============

  /**
   * Handle delete with browser confirmation
   * Uses native confirm dialog for simplicity
   */
  const handleDelete = useCallback(async (id: string) => {
    if (!deleteItem || !enableDelete) return;

    const item = items.find((i) => i.id === id);
    const itemName = item ? `ID: ${id.slice(0, 8)}...` : 'this item';

    if (confirm(`Are you sure you want to delete ${itemName}? This action cannot be undone.`)) {
      try {
        await deleteItem(id);
        await refresh();
      } catch (err) {
        console.error('Delete error:', err);
        alert('Failed to delete item. Please try again.');
      }
    }
  }, [items, deleteItem, enableDelete, refresh]);

  return {
    items,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    refresh,
    handleDelete,
  };
}

/**
 * Hook for managing filtered lists
 *
 * Extends useAdminList with filtering capabilities
 */
export function useFilteredAdminList<T extends AdminListItem>(
  options: UseAdminListOptions<T> & {
    filterFn?: (item: T, searchQuery: string) => boolean;
  }
): UseAdminListReturn<T> & {
  /** Items filtered by search query */
  filteredItems: T[];
} {
  const { filterFn } = options;

  // Get base hook return
  const baseReturn = useAdminList(options);

  // Compute filtered items
  const filteredItems = baseReturn.items.filter((item) => {
    if (!baseReturn.searchQuery || !filterFn) return true;
    return filterFn(item, baseReturn.searchQuery);
  });

  return {
    ...baseReturn,
    filteredItems,
  };
}

/**
 * Hook for admin pages with stats
 *
 * Adds statistics tracking to the base admin list hook
 */
export function useAdminListWithStats<T extends AdminListItem>(
  options: UseAdminListOptions<T> & {
    fetchStats?: () => Promise<Record<string, number>>;
  }
) {
  const { fetchItems, fetchStats, ...restOptions } = options;
  const [stats, setStats] = useState<Record<string, number>>({});

  // Use the base hook
  const baseHook = useAdminList({
    ...restOptions,
    fetchItems,
  });

  // Fetch stats function
  const fetchStatsData = useCallback(async () => {
    if (fetchStats) {
      try {
        const statsData = await fetchStats();
        setStats(statsData);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    }
  }, [fetchStats]);

  // Override refresh to also fetch stats
  const refreshWithStats = useCallback(async () => {
    await baseHook.refresh();
    await fetchStatsData();
  }, [baseHook, fetchStatsData]);

  // Fetch stats on mount
  useEffect(() => {
    fetchStatsData();
  }, [fetchStatsData]);

  return {
    ...baseHook,
    refresh: refreshWithStats,
    stats,
  };
}
