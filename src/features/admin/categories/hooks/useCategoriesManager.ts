/**
 * useCategoriesManager Hook
 *
 * Custom hook for managing categories page state and operations.
 * Handles data fetching, add, and delete operations.
 *
 * @module useCategoriesManager
 */

import { useState, useCallback, useEffect } from 'react';
import { api } from '../../../../services/api';
import { Category } from '../../../../types';

/**
 * Return type for useCategoriesManager hook
 */
export interface UseCategoriesManagerReturn {
  /** All categories */
  categories: Category[];

  /** Whether data is loading */
  loading: boolean;

  /** Whether add modal is open */
  isAddModalOpen: boolean;

  /** Open add category modal */
  openAddModal: () => void;

  /** Close add modal */
  closeAddModal: () => void;

  /** Handle add new category */
  handleAdd: (name: string, showOnHome: boolean) => Promise<void>;

  /** Handle delete category */
  handleDelete: (id: string) => Promise<void>;

  /** Refresh categories from API */
  refreshCategories: () => Promise<void>;
}

/**
 * Custom hook for categories page management
 *
 * Provides state management for the categories page:
 * - Fetches categories from API
 * - Manages add modal state
 * - Handles create and delete operations
 *
 * @returns Categories state and handlers
 *
 * @example
 * function AdminCategories() {
 *   const {
 *     categories,
 *     loading,
 *     isAddModalOpen,
 *     openAddModal,
 *     closeAddModal,
 *     handleAdd,
 *     handleDelete,
 *   } = useCategoriesManager();
 *
 *   return <CategoriesPage {...} />;
 * }
 */
export function useCategoriesManager(): UseCategoriesManagerReturn {
  // ============ State ============

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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

  // ============ Modal Management ============

  /**
   * Open add category modal
   */
  const openAddModal = useCallback(() => {
    setIsAddModalOpen(true);
  }, []);

  /**
   * Close add modal
   */
  const closeAddModal = useCallback(() => {
    setIsAddModalOpen(false);
  }, []);

  // ============ CRUD Operations ============

  /**
   * Handle add new category
   */
  const handleAdd = useCallback(async (name: string, showOnHome: boolean) => {
    try {
      await api.createCategory({ name, showOnHome });
      await fetchCategories();
      closeAddModal();
    } catch (error) {
      console.error('Failed to create category:', error);
      throw error;
    }
  }, [fetchCategories, closeAddModal]);

  /**
   * Handle delete category
   */
  const handleDelete = useCallback(async (id: string) => {
    try {
      await api.deleteCategory(id);
      await fetchCategories();
    } catch (error) {
      console.error('Failed to delete category:', error);
      throw error;
    }
  }, [fetchCategories]);

  return {
    categories,
    loading,
    isAddModalOpen,
    openAddModal,
    closeAddModal,
    handleAdd,
    handleDelete,
    refreshCategories,
  };
}
