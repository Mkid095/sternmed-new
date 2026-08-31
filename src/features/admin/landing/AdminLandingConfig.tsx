/**
 * Admin Landing Page Configuration
 *
 * Configuration interface for the landing/home page.
 * Controls which categories are displayed on the home page.
 *
 * @module AdminLandingConfig
 */

import React, { useState, useEffect, useMemo, type Key } from 'react';
import { LayoutTemplate, Eye, EyeOff, Package, GripVertical, Check, X } from 'lucide-react';
import { api } from '../../../services/api';
import { Category } from '../../../types';
import { useToastSuccess, useToastError, useConfirmationModal } from '../../shared/ui';

// Cache for optimistic updates
let categoryVisibilityCache = new Map<string, boolean>();

/**
 * Admin Landing Page Configuration Component
 *
 * Provides controls for landing page configuration with drag-to-reorder.
 *
 * @example
 * <Route path="/admin/landing-config" element={<AdminLandingConfig />} />
 */
export default function AdminLandingConfig() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [optimisticUpdates, setOptimisticUpdates] = useState<Map<string, boolean>>(new Map());

  const showSuccess = useToastSuccess();
  const showError = useToastError();
  const confirmModal = useConfirmationModal();

  const fetchData = async () => {
    try {
      const [cats, prods] = await Promise.all([
        api.getCategories(),
        api.getProducts(),
      ]);
      // Ensure each category has an order (default to 0 if undefined, but preserve existing order)
      const categoriesWithOrder = cats.map((cat, index) => ({
        ...cat,
        order: cat.order ?? index,
      }));
      setCategories(categoriesWithOrder);
      setProducts(prods);
    } catch (error) {
      console.error('Failed to fetch data', error);
      showError('Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const categoriesWithProductCount = useMemo(() => {
    // Sort by order (ascending)
    const sorted = [...categories].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    return sorted.map((cat) => {
      // Use optimistic update if available, otherwise use actual value
      const isVisible = optimisticUpdates.has(cat.id)
        ? optimisticUpdates.get(cat.id)!
        : cat.showOnHome;

      return {
        ...cat,
        showOnHome: isVisible,
        productCount: products.filter((p) => p.categoryId === cat.id).length,
      };
    });
  }, [categories, products, optimisticUpdates]);

  const visibleCategories = categoriesWithProductCount.filter((c) => c.showOnHome);
  const hiddenCategories = categoriesWithProductCount.filter((c) => !c.showOnHome);

  const toggleVisibility = async (category: Category) => {
    const newState = !category.showOnHome;

    // Optimistic update
    setOptimisticUpdates((prev) => new Map(prev).set(category.id, newState));

    try {
      await api.updateCategory(category.id, { showOnHome: newState });
      showSuccess(newState ? 'Category added to home page' : 'Category removed from home page');

      // Clear optimistic update and refetch to ensure consistency
      setOptimisticUpdates((prev) => {
        const next = new Map(prev);
        next.delete(category.id);
        return next;
      });
      fetchData();
    } catch (error) {
      console.error('Failed to update category', error);
      showError('Failed to update category');

      // Revert optimistic update on error
      setOptimisticUpdates((prev) => {
        const next = new Map(prev);
        next.delete(category.id);
        return next;
      });
    }
  };

  // Drag handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    setDraggedItem(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, targetId: string) => {
    e.preventDefault();
    if (!draggedItem || draggedItem === targetId) return;

    const draggedId = draggedItem;
    setDraggedItem(null);

    // Determine which section each category belongs to using the memo (includes optimistic toggles)
    const visibleIds = new Set(visibleCategories.map(c => c.id));
    const hiddenIds = new Set(hiddenCategories.map(c => c.id));

    const draggedInVisible = visibleIds.has(draggedId);
    const targetInVisible = visibleIds.has(targetId);

    if (draggedInVisible !== targetInVisible) {
      showError('Cannot drag between visible and hidden sections. Toggle visibility instead.');
      return;
    }

    // Build map of actual category objects from state (to avoid adding extra fields)
    const categoriesMap = new Map(categories.map(c => [c.id, c]));

    // Get the IDs for the section being reordered
    const sectionIds = draggedInVisible ? visibleIds : hiddenIds;
    const otherSectionIds = draggedInVisible ? hiddenIds : visibleIds;

    // Get actual category objects in current order for this section
    const sectionCategories = Array.from(sectionIds)
      .map(id => categoriesMap.get(id))
      .filter((c): c is Category => c !== undefined);
    const otherSectionCategories = Array.from(otherSectionIds)
      .map(id => categoriesMap.get(id))
      .filter((c): c is Category => c !== undefined);

    // Find indices in this section's array
    const draggedIdx = sectionCategories.findIndex(c => c.id === draggedId);
    const targetIdx = sectionCategories.findIndex(c => c.id === targetId);
    if (draggedIdx === -1 || targetIdx === -1) return;

    // Swap the two categories
    const newSection = [...sectionCategories];
    [newSection[draggedIdx], newSection[targetIdx]] = [newSection[targetIdx], newSection[draggedIdx]];

    // Renumber orders for this section sequentially
    const renumberedSection = newSection.map((cat, idx) => ({ ...cat, order: idx }));

    // Combine: visible section comes first, then hidden
    const combined = draggedInVisible
      ? [...renumberedSection, ...otherSectionCategories]
      : [...otherSectionCategories, ...renumberedSection];

    // Update state optimistically
    setCategories(combined);

    try {
      // Persist order changes (only for visible section matters for home page)
      await api.reorderCategories(renumberedSection.map(c => ({ id: c.id, order: c.order })));

      // Also update prominentCategories in site_settings to unify ordering systems
      // This ensures AdminLandingConfig and AdminSettings use the same ordering
      const prominentCategoryIds = renumberedSection.map(c => c.id);
      await api.updateSettings({ prominentCategories: prominentCategoryIds });

      showSuccess('Category order updated');
    } catch (error) {
      console.error('Failed to reorder categories:', error);
      showError('Failed to update category order');
      await fetchData();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-3">
            <LayoutTemplate size={28} className="text-primary-600" />
            Landing Page
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Configure which categories appear on the home page. Drag to reorder.
          </p>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-primary-50 border border-primary-200 rounded-lg">
            <Eye size={18} className="text-primary-600" />
            <span className="text-sm font-medium text-primary-700">{visibleCategories.length} visible</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg">
            <EyeOff size={18} className="text-slate-500" />
            <span className="text-sm font-medium text-slate-600">{hiddenCategories.length} hidden</span>
          </div>
        </div>
      </div>

      {/* Visible Categories */}
      {visibleCategories.length > 0 && (
        <div>
          <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Eye size={18} className="text-primary-600" />
            Visible on Home Page ({visibleCategories.length})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {visibleCategories.map((cat) => (
              <CategoryCard
                key={cat.id}
                category={cat}
                isVisible
                onToggle={toggleVisibility}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              />
            ))}
          </div>
        </div>
      )}

      {/* Hidden Categories */}
      {hiddenCategories.length > 0 && (
        <div>
          <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
            <EyeOff size={18} className="text-slate-400" />
            Hidden Categories ({hiddenCategories.length})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {hiddenCategories.map((cat) => (
              <CategoryCard
                key={cat.id}
                category={cat}
                isVisible={false}
                onToggle={toggleVisibility}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {categories.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-8 sm:p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <LayoutTemplate size={32} className="text-slate-300" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No categories found</h3>
          <p className="text-slate-500">
            Create categories first to configure the landing page.
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Category Card Component
 */
interface CategoryCardProps {
  key?: Key;
  category: Category & { productCount: number };
  isVisible: boolean;
  onToggle: (category: Category) => Promise<void>;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, id: string) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, id: string) => void;
}

function CategoryCard({ category, isVisible, onToggle, onDragStart, onDragOver, onDrop }: CategoryCardProps) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, category.id)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, category.id)}
      className={`bg-white rounded-xl border overflow-hidden transition-all hover:shadow-md ${
        isVisible ? 'border-primary-200 ring-1 ring-primary-100' : 'border-slate-200'
      }`}
    >
      {/* Image/Header */}
      <div className={`relative aspect-video flex items-center justify-center ${
        isVisible ? 'bg-gradient-to-br from-primary-50 to-primary-100' : 'bg-gradient-to-br from-slate-50 to-slate-100'
      }`}>
        {category.image ? (
          <img
            src={category.image}
            alt={category.name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <Package size={32} className={isVisible ? 'text-primary-200' : 'text-slate-300'} />
        )}

        {/* Drag Handle */}
        <div className="absolute top-2 left-2 cursor-move opacity-50 hover:opacity-100">
          <GripVertical size={16} className={isVisible ? 'text-white' : 'text-slate-400'} />
        </div>

        {/* Visible Badge */}
        {isVisible && (
          <div className="absolute top-2 right-2 bg-primary-600 text-white px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
            <Check size={12} />
            Visible
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="font-semibold text-slate-900 text-sm line-clamp-1">{category.name}</h3>
        <p className="text-xs text-slate-500 mt-1">
          {category.productCount} product{category.productCount !== 1 ? 's' : ''} total
        </p>

        {/* Toggle Button */}
        <button
          onClick={() => onToggle(category)}
          className={`w-full mt-3 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
            isVisible
              ? 'bg-primary-100 text-primary-700 hover:bg-primary-200'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          {isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
          {isVisible ? 'Hide from Home' : 'Show on Home'}
        </button>
      </div>
    </div>
  );
}
