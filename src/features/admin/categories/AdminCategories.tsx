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
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Home,
  X,
  Package,
  Eye,
  EyeOff
} from 'lucide-react';
import { Category } from '../../../types';
import { api } from '../../../services/api';
import { ImageUpload, ConfirmationModal, Modal, useConfirmationModal, useToastSuccess, useToastError } from '../../shared/ui';

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

        {/* Search Bar */}
        <div className="relative">
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
            >
              <X size={16} />
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
          {/* Mobile Grid - 2 columns */}
          <div className="grid grid-cols-2 gap-3 sm:hidden">
            {filteredCategories.map((cat) => (
              <CategoryCompactCard
                key={cat.id}
                category={cat}
                onEdit={openEditForm}
                onDelete={handleDelete}
                onToggleVisibility={toggleShowOnHome}
              />
            ))}
          </div>

          {/* Desktop Grid - 3 columns */}
          <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredCategories.map((cat) => (
              <CategoryCard
                key={cat.id}
                category={cat}
                onEdit={openEditForm}
                onDelete={handleDelete}
                onToggleVisibility={toggleShowOnHome}
              />
            ))}
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

/**
 * Category Compact Card (Mobile)
 */
interface CategoryCardProps {
  key?: Key;
  category: Category & { productCount: number };
  onEdit: (category: Category) => void;
  onDelete: (id: string, name: string) => Promise<void>;
  onToggleVisibility: (category: Category) => Promise<void>;
}

function CategoryCompactCard({ category, onEdit, onDelete, onToggleVisibility }: CategoryCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Image or Placeholder */}
      <div className="relative aspect-video bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
        {category.image ? (
          <img
            src={category.image}
            alt={category.name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <Package size={32} className="text-primary-200" />
        )}

        {/* Visibility Badge */}
        <div className="absolute top-2 right-2">
          <button
            onClick={() => onToggleVisibility(category)}
            className={`p-1.5 rounded-lg backdrop-blur-sm transition-colors ${
              category.showOnHome
                ? 'bg-primary-600/90 text-white'
                : 'bg-white/80 text-slate-400 hover:text-primary-600'
            }`}
            title={category.showOnHome ? 'Visible on home' : 'Hidden from home'}
          >
            {category.showOnHome ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="font-semibold text-slate-900 text-sm line-clamp-1">{category.name}</h3>
        <p className="text-xs text-slate-500 mt-1">{category.productCount} product{category.productCount !== 1 ? 's' : ''}</p>

        {/* Actions */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => onEdit(category)}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
          >
            <Edit size={14} />
            Edit
          </button>
          <button
            onClick={() => onDelete(category.id, category.name)}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-medium transition-colors"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Category Card (Desktop)
 */
function CategoryCard({ category, onEdit, onDelete, onToggleVisibility }: CategoryCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Image or Placeholder */}
      <div className="relative aspect-video bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
        {category.image ? (
          <img
            src={category.image}
            alt={category.name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <Package size={48} className="text-primary-200" />
        )}

        {/* Visibility Badge */}
        {category.showOnHome && (
          <div className="absolute top-2 left-2 bg-primary-600 text-white px-3 py-1 rounded-lg flex items-center gap-1.5 text-sm font-medium shadow-sm">
            <Home size={14} />
            Visible
          </div>
        )}

        {/* Toggle Visibility Button */}
        <button
          onClick={() => onToggleVisibility(category)}
          className="absolute top-2 right-2 p-2 rounded-lg backdrop-blur-sm transition-colors bg-white/80 text-slate-600 hover:text-primary-600 hover:bg-white"
          title={category.showOnHome ? 'Hide from home page' : 'Show on home page'}
        >
          {category.showOnHome ? <Eye size={18} /> : <EyeOff size={18} />}
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-slate-900 text-lg line-clamp-1">{category.name}</h3>
        <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
          <Package size={14} />
          {category.productCount} product{category.productCount !== 1 ? 's' : ''}
        </p>

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => onEdit(category)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
          >
            <Edit size={16} />
            Edit
          </button>
          <button
            onClick={() => onDelete(category.id, category.name)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors"
          >
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Category Form Modal
 */
interface CategoryFormModalProps {
  key?: Key;
  formData: {
    name: string;
    image: string;
    showOnHome: boolean;
  };
  onChange: (data: any) => void;
  onSubmit: (e: FormEvent) => void;
  onClose: () => void;
  isEditing: boolean;
}

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
