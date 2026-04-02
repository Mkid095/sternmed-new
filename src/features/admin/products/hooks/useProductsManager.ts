/**
 * useProductsManager Hook
 *
 * Custom hook for managing products page state and operations.
 * Handles data fetching, CRUD operations, and form management.
 *
 * @module useProductsManager
 */

import React, { useState, useCallback, useEffect, FormEvent } from 'react';
import { api } from '../../../../services/api';
import { Product, Category, ProductStatus } from '../../../../types';
import { useToastSuccess, useToastError } from '../../../shared/ui';

/**
 * Product form data structure
 */
export interface ProductFormData {
  /** Product name */
  name: string;

  /** Product description */
  description: string;

  /** Product price in Ksh */
  price: number;

  /** Category ID */
  categoryId: string;

  /** Product image URL */
  imageUrl: string;

  /** Stock quantity */
  stock: number;

  /** Featured status */
  isFeatured: boolean;

  /** Product status */
  status: ProductStatus;
}

/**
 * Return type for useProductsManager hook
 */
export interface UseProductsManagerReturn {
  /** All products */
  products: Product[];

  /** All categories */
  categories: Category[];

  /** Whether data is loading */
  loading: boolean;

  /** Search query string */
  search: string;

  /** Whether add/edit form is open */
  isAdding: boolean;

  /** ID of product being edited (null if not editing) */
  editingProductId: string | null;

  /** Current form data */
  newProduct: ProductFormData;

  /** Update search query */
  setSearch: (search: string) => void;

  /** Open add form */
  openAddForm: () => void;

  /** Open edit form for a product */
  openEditForm: (product: Product) => void;

  /** Close form and reset */
  closeForm: () => void;

  /** Handle delete product */
  handleDelete: (id: string) => Promise<void>;

  /** Handle toggle featured status */
  toggleFeatured: (id: string, currentStatus: boolean) => Promise<void>;

  /** Handle form submission (create or update) */
  handleFormSubmit: (e: FormEvent) => Promise<void>;

  /** Update form data */
  setNewProduct: React.Dispatch<React.SetStateAction<ProductFormData>>;
}

/**
 * Empty product form state
 */
const EMPTY_FORM: ProductFormData = {
  name: '',
  description: '',
  price: 0,
  categoryId: '',
  imageUrl: '',
  stock: 0,
  isFeatured: false,
  status: 'active',
};

/**
 * Custom hook for products page management
 *
 * Provides comprehensive state management for the products page:
 * - Fetches products and categories
 * - Manages add/edit form state
 * - Handles create, update, delete operations
 * - Handles featured status toggle
 * - Search functionality
 *
 * @returns Products state and handlers
 *
 * @example
 * function AdminProducts() {
 *   const {
 *     products,
 *     categories,
 *     loading,
 *     search,
 *     isAdding,
 *     editingProductId,
 *     newProduct,
 *     setSearch,
 *     openAddForm,
 *     closeForm,
 *     handleDelete,
 *     toggleFeatured,
 *     handleFormSubmit,
 *     setNewProduct,
 *   } = useProductsManager();
 *
 *   return <ProductsPage {...} />;
 * }
 */
export function useProductsManager(): UseProductsManagerReturn {
  // ============ State ============

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState<ProductFormData>(EMPTY_FORM);

  // Toast notifications
  const showSuccess = useToastSuccess();
  const showError = useToastError();

  // ============ Data Fetching ============

  /**
   * Fetch products and categories from API
   */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [prods, cats] = await Promise.all([
        api.getProducts(),
        api.getCategories(),
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Initial data fetch on mount
   */
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ============ Form Management ============

  /**
   * Open add product form
   */
  const openAddForm = useCallback(() => {
    setIsAdding(true);
    setEditingProductId(null);
    setNewProduct(EMPTY_FORM);
  }, []);

  /**
   * Open edit product form with pre-filled data
   */
  const openEditForm = useCallback((product: Product) => {
    setEditingProductId(product.id);
    setNewProduct({
      name: product.name,
      description: product.description,
      price: product.price,
      categoryId: product.categoryId,
      imageUrl: product.imageUrl,
      stock: product.stock,
      isFeatured: product.isFeatured,
      status: product.status,
    });
  }, []);

  /**
   * Close form and reset state
   */
  const closeForm = useCallback(() => {
    setIsAdding(false);
    setEditingProductId(null);
    setNewProduct(EMPTY_FORM);
  }, []);

  // ============ CRUD Operations ============

  /**
   * Handle delete product with confirmation
   */
  const handleDelete = useCallback(async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await api.deleteProduct(id);
        showSuccess('Product deleted successfully');
        await fetchData();
      } catch (error) {
        console.error('Failed to delete product:', error);
        showError('Failed to delete product. Please try again.');
      }
    }
  }, [fetchData, showSuccess, showError]);

  /**
   * Handle toggle featured status
   */
  const toggleFeatured = useCallback(async (id: string, currentStatus: boolean) => {
    try {
      await api.updateProduct(id, { isFeatured: !currentStatus });
      await fetchData();
      showSuccess('Product updated successfully');
    } catch (error) {
      console.error('Failed to toggle featured status:', error);
      showError('Failed to update product. Please try again.');
    }
  }, [fetchData, showSuccess, showError]);

  /**
   * Handle form submission (create or update)
   */
  const handleFormSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();

    // Validate category selection
    if (!newProduct.categoryId) {
      showError('Please select a category');
      return;
    }

    try {
      if (editingProductId) {
        // Update existing product
        await api.updateProduct(editingProductId, newProduct);
        showSuccess('Product updated successfully');
      } else {
        // Create new product
        await api.createProduct(newProduct);
        showSuccess('Product added successfully');
      }

      // Close form and refresh data
      closeForm();
      await fetchData();
    } catch (error) {
      console.error('Failed to save product:', error);
      showError('Failed to save product. Please try again.');
    }
  }, [newProduct, editingProductId, fetchData, closeForm, showSuccess, showError]);

  return {
    products,
    categories,
    loading,
    search,
    isAdding,
    editingProductId,
    newProduct,
    setSearch,
    openAddForm,
    openEditForm,
    closeForm,
    handleDelete,
    toggleFeatured,
    handleFormSubmit,
    setNewProduct,
  };
}
