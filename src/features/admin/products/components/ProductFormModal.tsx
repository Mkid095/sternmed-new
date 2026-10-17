/**
 * Add / edit product dialog.
 *
 * Split out of AdminProducts.tsx, which had grown past 1000 lines.
 *
 * @module ProductFormModal
 */

import type { FormEvent, Key } from 'react';
import { X } from 'lucide-react';
import type { Category, ProductStatus } from '../../../../types';
import { ImageUpload, MultiImageUpload } from '../../../shared/ui';

/**
 * Product Form Modal Component
 */
interface ProductFormModalProps {
  key?: Key;
  product: {
    name: string;
    description: string;
    price: string;
    categoryId: string;
    imageUrl: string;
    images: string[];
    stock: string;
    isFeatured: boolean;
    status: ProductStatus;
  };
  categories: Category[];
  isEditing: boolean;
  onChange: (product: any) => void;
  onSubmit: (e: FormEvent) => void;
  onClose: () => void;
}

function ProductFormModal({ product, categories, isEditing, onChange, onSubmit, onClose }: ProductFormModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">
            {isEditing ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-4 space-y-4 pb-24 sm:pb-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Product Name *</label>
            <input
              type="text"
              required
              value={product.name}
              onChange={(e) => onChange({ ...product, name: e.target.value })}
              placeholder="e.g., I.V. Cannula 18G"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description *</label>
            <textarea
              required
              rows={3}
              value={product.description}
              onChange={(e) => onChange({ ...product, description: e.target.value })}
              placeholder="Brief product description..."
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Price (Ksh) *</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={product.price}
                onChange={(e) => onChange({ ...product, price: e.target.value })}
                placeholder="0.00"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Stock *</label>
              <input
                type="number"
                required
                min="0"
                value={product.stock}
                onChange={(e) => onChange({ ...product, stock: e.target.value })}
                placeholder="0"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
            <select
              required
              value={product.categoryId}
              onChange={(e) => onChange({ ...product, categoryId: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <ImageUpload
              label="Product Image (Main)"
              value={product.imageUrl}
              onChange={(url) => onChange({ ...product, imageUrl: url })}
              recommendedSize="Recommended: 400x300px"
              required
            />
          </div>

          <div>
            <MultiImageUpload
              label="Product Gallery (Optional)"
              value={product.images}
              onChange={(urls) => onChange({ ...product, images: urls })}
              recommendedSize="Recommended: 400x300px. Max 5 images."
              maxImages={5}
            />
          </div>

          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
            <input
              type="checkbox"
              id="isFeatured"
              checked={product.isFeatured}
              onChange={(e) => onChange({ ...product, isFeatured: e.target.checked })}
              className="w-5 h-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="isFeatured" className="text-sm font-medium text-slate-700 cursor-pointer">
              Feature on home page
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select
              required
              value={product.status}
              onChange={(e) => onChange({ ...product, status: e.target.value as ProductStatus })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="active">Active</option>
              <option value="coming_soon">Coming Soon</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
            <p className="text-xs text-slate-500 mt-1">
              {product.status === 'coming_soon' && 'Product will be visible but cannot be purchased'}
              {product.status === 'draft' && 'Product is hidden from customers'}
              {product.status === 'archived' && 'Product is archived and hidden from all views'}
              {product.status === 'active' && 'Product is available for purchase'}
            </p>
          </div>

          <div className="flex gap-3 p-4 border-t border-slate-200 bg-white sm:bg-slate-50 pb-20 sm:pb-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors"
            >
              {isEditing ? 'Update Product' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export { ProductFormModal };

export type { ProductFormModalProps };
