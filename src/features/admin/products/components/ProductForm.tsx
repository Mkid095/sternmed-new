import { FormEvent } from 'react';
import { X } from 'lucide-react';
import { Product, Category, ProductStatus } from '../../../../types';
import { Input, ImageUpload } from '../../../shared/ui';

interface ProductFormProps {
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;
  product: {
    name: string;
    description: string;
    price: number;
    categoryId: string;
    imageUrl: string;
    stock: number;
    isFeatured: boolean;
    status: ProductStatus;
  };
  onProductChange: (product: {
    name: string;
    description: string;
    price: number;
    categoryId: string;
    imageUrl: string;
    stock: number;
    isFeatured: boolean;
    status: ProductStatus;
  }) => void;
  isEditing?: boolean;
}

export function ProductForm({
  categories,
  isOpen,
  onClose,
  onSubmit,
  product,
  onProductChange,
  isEditing = false,
}: ProductFormProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 className="text-lg font-bold text-slate-900">{isEditing ? 'Edit Product' : 'Add New Product'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          <form id="add-product-form" onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Name"
                required
                value={product.name}
                onChange={(e) => onProductChange({ ...product, name: e.target.value })}
              />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                <select
                  required
                  value={product.categoryId}
                  onChange={(e) => onProductChange({ ...product, categoryId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label="Price (Ksh)"
                type="number"
                required
                min="0"
                step="0.01"
                value={product.price}
                onChange={(e) => onProductChange({ ...product, price: parseFloat(e.target.value) })}
              />
              <Input
                label="Stock"
                type="number"
                required
                min="0"
                value={product.stock}
                onChange={(e) => onProductChange({ ...product, stock: parseInt(e.target.value) })}
              />
              <div className="md:col-span-2">
                <ImageUpload
                  label="Product Image"
                  value={product.imageUrl}
                  onChange={(url) => onProductChange({ ...product, imageUrl: url })}
                  recommendedSize="Recommended size: 400x300 pixels"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  required
                  rows={3}
                  value={product.description}
                  onChange={(e) => onProductChange({ ...product, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>
              <div className="md:col-span-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isFeatured"
                  checked={product.isFeatured}
                  onChange={(e) => onProductChange({ ...product, isFeatured: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isFeatured" className="text-sm font-medium text-slate-700">
                  Feature on Home Page
                </label>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select
                  required
                  value={product.status}
                  onChange={(e) => onProductChange({ ...product, status: e.target.value as ProductStatus })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="coming_soon">Coming Soon</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  {product.status === 'coming_soon' && 'Product will be visible but cannot be purchased'}
                  {product.status === 'draft' && 'Product is hidden from customers'}
                  {product.status === 'archived' && 'Product is archived and hidden'}
                  {product.status === 'active' && 'Product is available for purchase'}
                </p>
              </div>
            </div>
          </form>
        </div>
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-product-form"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
          >
            {isEditing ? 'Update Product' : 'Save Product'}
          </button>
        </div>
      </div>
    </div>
  );
}
