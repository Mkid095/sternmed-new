/**
 * Admin Categories Page
 *
 * Main category management interface for administrators.
 * Features include:
 * - Category listing with product count
 * - Add new categories with image
 * - Edit categories
 * - Delete categories
 * - Toggle visibility on home page
 *
 * @module AdminCategories
 */

import { useState, useEffect, useMemo, FormEvent, type Key } from 'react';
import { clsx } from 'clsx';
import { Plus, Search, X, Home, Package } from 'lucide-react';
import { Category } from '../../../types';
import { api } from '../../../services/api';
import { ImageUpload, Modal, ConfirmationModal, useConfirmationModal, useToastSuccess, useToastError } from '../../shared/ui';
import { CategoryCard, CategoryCompactCard } from './components/CategoryCard';
import { useIsDesktop } from '../../../hooks/useMediaQuery';

/**
 * Admin Categories Page Component
 *
 * Provides category management with mobile-first design.
 *
 * @example
 * <Route path="/admin/categories" element={<AdminCategories />} />
 */
export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const isDesktop = useIsDesktop();

  const [formData, setFormData] = useState({
    name: '',
    image: '',
    showOnHome: false,
  });

  const showSuccess = useToastSuccess();
  const showError = useToastError();
  const confirmModal = useConfirmationModal();

  // ============ Data Fetching ============

  const fetchData = async () => {
    try {
      const [cats, prods] = await Promise.all([
        api.getCategories(),
        api.getProducts(),
      ]);
      setCategories(cats);
      setProducts(prods);
    } catch (error) {
      console.error('Failed to fetch data', error);
      showError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ============ Computed Values ============

  const categoriesWithProductCount = useMemo(() => {
    return categories.map((cat) => ({
      ...cat,
      productCount: products.filter((p) => p.categoryId === cat.id).length,
    }));
  }, [categories, products]);

  const filteredCategories = useMemo(() => {
    return categoriesWithProductCount.filter((cat) =>
      cat.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [categoriesWithProductCount, search]);

  // ============ Handlers ============

  const openAddForm = () => {
    setFormData({ name: '', image: '', showOnHome: false });
    setEditingCategory(null);
    setIsAdding(true);
  };

  const openEditForm = (category: Category) => {
    setFormData({
      name: category.name,
      image: category.image || '',
      showOnHome: category.showOnHome || false,
    });
    setEditingCategory(category);
    setIsAdding(true);
  };

  const closeForm = () => {
    setIsAdding(false);
    setEditingCategory(null);
    setFormData({ name: '', image: '', showOnHome: false });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      const data = {
        name: formData.name,
        image: formData.image,
        showOnHome: formData.showOnHome,
      };

      if (editingCategory) {
        await api.updateCategory(editingCategory.id, data);
        showSuccess('Category updated successfully');
      } else {
        await api.createCategory(data);
        showSuccess('Category added successfully');
      }

      closeForm();
      fetchData();
    } catch (error) {
      console.error('Failed to save category', error);
      showError(editingCategory ? 'Failed to update category' : 'Failed to add category');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await confirmModal.confirm({
      title: 'Delete Category',
      message: `Are you sure you want to delete "${name}"? Products in this category will become uncategorized.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });

    if (confirmed) {
      try {
        await api.deleteCategory(id);
        showSuccess('Category deleted successfully');
        fetchData();
      } catch (error) {
        console.error('Failed to delete category', error);
        showError('Failed to delete category');
      }
    }
  };

  const toggleShowOnHome = async (category: Category) => {
    try {
      await api.updateCategory(category.id, { showOnHome: !category.showOnHome });
      showSuccess(!category.showOnHome ? 'Category added to home page' : 'Category removed from home page');
      fetchData();
    } catch (error) {
      console.error('Failed to update category', error);
      showError('Failed to update category');
    }
  };

  // ============ Loading State ============

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-primary-600"></div>
      </div>
    );
  }

  // ============ Main Layout ============

  return (
    <div className="flex flex-col gap-4 pb-10">
      {/* No page title here — the layout header bar already reads "Categories",
          so the page repeated the same word in a second, larger heading just
          below it. The count line is the part that adds information. */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">{categories.length} categories total</p>
          <button
            onClick={openAddForm}
            className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors shadow-sm"
          >
            <Plus size={20} />
            Add Category
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search
            size={15}
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            placeholder="Search categories"
            aria-label="Search categories"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={clsx(
              'w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 text-sm text-slate-900',
              'placeholder:text-slate-400 transition-colors',
              'hover:border-slate-300 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/25',
              search ? 'pr-9' : 'pr-3',
            )}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Add/Edit Category Modal */}
      {isAdding && (
        <CategoryFormModal
          formData={formData}
          onChange={setFormData}
          onSubmit={handleSubmit}
          onClose={closeForm}
          isEditing={!!editingCategory}
        />
      )}

      {/* Categories Display */}
      {filteredCategories.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 sm:p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Package size={32} className="text-slate-300" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No categories found</h3>
          <p className="text-slate-500 mb-4">
            {search ? 'Try adjusting your search term' : 'Add your first category to get started'}
          </p>
          {!search && (
            <button
              onClick={openAddForm}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors"
            >
              <Plus size={20} />
              Add Your First Category
            </button>
          )}
        </div>
      ) : (
        <>
          {/*
            One grid, not two. These used to be rendered side by side with one
            hidden by `sm:hidden`, which hid it visually but not from assistive
            technology - every category was exposed twice in the accessibility
            tree. The card variant is now chosen by breakpoint instead.
          */}
          <div
            className={
              isDesktop
                ? 'grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
                : 'grid grid-cols-2 gap-3'
            }
          >
            {filteredCategories.map((cat) =>
              isDesktop ? (
                <CategoryCard
                  key={cat.id}
                  category={cat}
                  onEdit={openEditForm}
                  onDelete={handleDelete}
                  onToggleVisibility={toggleShowOnHome}
                />
              ) : (
                <CategoryCompactCard
                  key={cat.id}
                  category={cat}
                  onEdit={openEditForm}
                  onDelete={handleDelete}
                  onToggleVisibility={toggleShowOnHome}
                />
              )
            )}
          </div>
        </>
      )}

      {/* Mobile FAB */}
      <button
        onClick={openAddForm}
        className="sm:hidden fixed bottom-20 right-4 w-14 h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all active:scale-95 z-30"
      >
        <Plus size={24} />
      </button>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal {...confirmModal.props} />
    </div>
  );
}

// CategoryCard / CategoryCompactCard now live in components/CategoryCard.tsx
// and carry a real toggle for "show on home" instead of a badge plus an eye button.
/**
 * Add/edit category dialog.
 *
 * Was a fourth hand-rolled modal: no focus trap, no Escape handling, no
 * role="dialog", and its footer had a `pb-20` hack to clear the mobile bottom
 * nav. Now the shared Radix-backed Modal, with the actions in its footer so
 * they stay reachable when the body scrolls.
 *
 * The submit button lives in the footer, outside the <form>, so it is wired to
 * the form by id via the `form` attribute rather than by nesting — otherwise
 * the buttons could not be pinned outside the scroll area.
 */
interface CategoryFormModalProps {
  formData: { name: string; image: string; showOnHome: boolean };
  onChange: (data: { name: string; image: string; showOnHome: boolean }) => void;
  onSubmit: (e: FormEvent) => void;
  onClose: () => void;
  isEditing: boolean;
}

function CategoryFormModal({ formData, onChange, onSubmit, onClose, isEditing }: CategoryFormModalProps) {
  const formId = 'category-form';

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isEditing ? 'Edit Category' : 'Add New Category'}
      size="md"
      footer={
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            form={formId}
            className="flex-1 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700"
          >
            {isEditing ? 'Update Category' : 'Add Category'}
          </button>
        </div>
      }
    >
      <form id={formId} onSubmit={onSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="category-name" className="mb-1 block text-sm font-medium text-slate-700">
            Category name <span className="text-red-500">*</span>
          </label>
          <input
            id="category-name"
            type="text"
            required
            value={formData.name}
            onChange={(e) => onChange({ ...formData, name: e.target.value })}
            placeholder="e.g., IV Cannulas"
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <ImageUpload
          label="Category Image (Optional)"
          value={formData.image}
          onChange={(url) => onChange({ ...formData, image: url })}
          recommendedSize="Recommended: 400x300px"
        />

        <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
          <input
            type="checkbox"
            id="showOnHome"
            checked={formData.showOnHome}
            onChange={(e) => onChange({ ...formData, showOnHome: e.target.checked })}
            className="h-5 w-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="showOnHome" className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
            <Home size={16} className="text-slate-400" />
            Show on home page
          </label>
        </div>
      </form>
    </Modal>
  );
}
