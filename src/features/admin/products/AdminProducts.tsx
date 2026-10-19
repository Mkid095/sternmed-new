/**
 * Admin Products Page
 *
 * Main product management interface for administrators.
 * Features include:
 * - Product listing with search and filters
 * - Add and edit products with professional form
 * - Delete products with confirmation
 * - Toggle featured status
 * - Low stock alerts
 * - Category filter
 * - Stock level indicator
 *
 * @module AdminProducts
 */

import { useState, useMemo, useEffect, FormEvent, type Key } from 'react';
import {
  Search,
  Plus,
  SlidersHorizontal,
  X,
  Star,
  Package,
  PackageX,
  AlertTriangle
} from 'lucide-react';
import { Product, Category, ProductStatus } from '../../../types';
import { ImageUpload, MultiImageUpload, ConfirmationModal, useConfirmationModal, useToastSuccess, useToastError } from '../../shared/ui';
import { api } from '../../../services/api';
import { ProductCompactCard, ProductCard, ProductTableRow } from './components/ProductCards';
import { ProductFormModal } from './components/ProductFormModal';
import { ProductToolbar } from './components/ProductToolbar';

/**
 * Admin Products Page Component
 *
 * Provides comprehensive product management with mobile-first design.
 *
 * @example
 * <Route path="/admin/products" element={<AdminProducts />} />
 */
export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [statusFilter, setStatusFilter] = useState<ProductStatus | 'all'>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [togglingFeatured, setTogglingFeatured] = useState<string | null>(null);

  const showSuccess = useToastSuccess();
  const showError = useToastError();
  const { confirm, props } = useConfirmationModal();

  // New product form state
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    imageUrl: '',
    images: [] as string[],
    stock: '',
    isFeatured: false,
    status: 'active' as ProductStatus,
  });

  // ============ Data Fetching ============

  const fetchData = async () => {
    try {
      const [prods, cats] = await Promise.all([
        api.getProducts(),
        api.getCategories(),
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch (error) {
      console.error('Failed to fetch data', error);
      showError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ============ Filter Logic ============

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                           p.description.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !selectedCategory || p.categoryId === selectedCategory;
      const matchesStock =
        stockFilter === 'all' ||
        (stockFilter === 'low' && p.stock > 0 && p.stock < 20) ||
        (stockFilter === 'out' && p.stock === 0);
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStock && matchesStatus;
    });
  }, [products, search, selectedCategory, stockFilter, statusFilter]);

  /*
    Stock alerts only count products that are actually on sale.

    These used to count every product regardless of status, so anything still
    marked coming_soon, draft or archived was reported as "out of stock" — it
    has stock 0 because nobody stocked it yet, not because it sold out. With
    most of the catalogue still coming_soon that produced a banner claiming 41
    of 42 products were out of stock, which is alarming and meaningless: a
    product you cannot buy yet cannot be out of stock.
  */
  const sellableProducts = products.filter((p) => p.status === 'active');
  const outOfStockCount = sellableProducts.filter((p) => p.stock === 0).length;
  const lowStockCount = sellableProducts.filter((p) => p.stock > 0 && p.stock < 20).length;

  // ============ Handlers ============

  const openAddForm = () => {
    setNewProduct({
      name: '',
      description: '',
      price: '',
      categoryId: '',
      imageUrl: '',
      images: [],
      stock: '',
      isFeatured: false,
      status: 'active',
    });
    setIsAdding(true);
    setEditingProduct(null);
  };

  const openEditForm = (product: Product) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      categoryId: product.categoryId,
      imageUrl: product.imageUrl,
      images: product.images || [],
      stock: product.stock.toString(),
      isFeatured: product.isFeatured,
      status: product.status,
    });
    setIsAdding(true);
  };

  const closeForm = () => {
    setIsAdding(false);
    setEditingProduct(null);
    setNewProduct({
      name: '',
      description: '',
      price: '',
      categoryId: '',
      imageUrl: '',
      images: [],
      stock: '',
      isFeatured: false,
      status: 'active',
    });
  };

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      // Validate required fields
      if (!newProduct.name?.trim()) {
        showError('Product name is required');
        return;
      }
      if (!newProduct.description?.trim()) {
        showError('Description is required');
        return;
      }
      if (!newProduct.price || isNaN(parseFloat(newProduct.price))) {
        showError('Valid price is required');
        return;
      }
      if (!newProduct.categoryId) {
        showError('Please select a category');
        return;
      }
      if (!newProduct.imageUrl) {
        showError('Main product image is required');
        return;
      }
      if (!newProduct.stock || isNaN(parseInt(newProduct.stock))) {
        showError('Valid stock quantity is required');
        return;
      }

      const productData = {
        name: newProduct.name.trim(),
        description: newProduct.description.trim(),
        price: parseFloat(newProduct.price),
        categoryId: newProduct.categoryId,
        imageUrl: newProduct.imageUrl,
        images: newProduct.images || [],
        stock: parseInt(newProduct.stock, 10),
        isFeatured: newProduct.isFeatured,
        status: newProduct.status,
      };

      if (editingProduct) {
        await api.updateProduct(editingProduct.id, productData);
        showSuccess('Product updated successfully');
      } else {
        await api.createProduct(productData);
        showSuccess('Product added successfully');
      }

      // Do NOT closeForm() here: the wizard stays open on its Review screen
      // with a Done button, so the save is visible and deliberate. Leaving is
      // the user's action (Done, X, or Escape), not a side effect of success.
      await fetchData();
    } catch (error) {
      console.error('Failed to save product:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      showError(`${editingProduct ? 'Failed to update product' : 'Failed to add product'}: ${errorMessage}`);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Product',
      message: 'Are you sure you want to delete this product? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });

    if (confirmed) {
      try {
        await api.deleteProduct(id);
        showSuccess('Product deleted successfully');
        fetchData();
      } catch (error) {
        console.error('Failed to delete product', error);
        showError('Failed to delete product');
      }
    }
  };

  const toggleFeatured = async (id: string, currentStatus: boolean) => {
    // Prevent multiple rapid clicks
    if (togglingFeatured === id) return;

    setTogglingFeatured(id);
    try {
      await api.updateProduct(id, { isFeatured: !currentStatus });
      showSuccess(!currentStatus ? 'Product added to featured' : 'Product removed from featured');
      await fetchData();
    } catch (error) {
      console.error('Failed to toggle featured:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showError(`Failed to update featured status: ${errorMessage}`);
      // Revert optimistic UI by refetching
      await fetchData();
    } finally {
      setTogglingFeatured(null);
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
    <div className="space-y-4 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          {/* No page title: the layout header bar already reads "Products", and
              this printed the same word again in a larger heading right beneath
              it. The count is the part that adds information. */}
          <p className="text-sm text-slate-500">{products.length} products total</p>
          <button
            onClick={openAddForm}
            className="hidden sm:inline-flex items-center gap-2 rounded-lg bg-primary-600 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
          >
            <Plus size={16} />
            Add Product
          </button>
        </div>

        {/* Low Stock Alerts */}
        {(lowStockCount > 0 || outOfStockCount > 0) && (
          <div className="flex flex-wrap gap-2">
            {lowStockCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-accent-50 border border-accent-200 rounded-lg">
                <AlertTriangle size={16} className="text-accent-600 flex-shrink-0" />
                <span className="text-sm font-medium text-accent-700">
                  {lowStockCount} product{lowStockCount > 1 ? 's' : ''} low on stock
                </span>
              </div>
            )}
            {outOfStockCount > 0 && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                {/* PackageX, not X. A bare cross reads as "close" or "cancel",
                    which is not what an out-of-stock notice is telling you. */}
                <PackageX size={16} className="flex-shrink-0 text-red-600" aria-hidden="true" />
                <span className="text-sm font-medium text-red-700">
                  {outOfStockCount} out of stock
                </span>
              </div>
            )}
          </div>
        )}
      </div>

        <ProductToolbar
          search={search}
          onSearchChange={setSearch}
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={(v) => setSelectedCategory(v || null)}
          stockFilter={stockFilter}
          onStockFilterChange={setStockFilter}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          resultCount={filteredProducts.length}
          totalCount={products.length}
          isFiltered={
            Boolean(search) || Boolean(selectedCategory) ||
            stockFilter !== 'all' || statusFilter !== 'all'
          }
          onClearFilters={() => {
            setSearch('');
            setSelectedCategory(null);
            setStockFilter('all');
            setStatusFilter('all');
          }}
        />

      {/* Mobile Filter Bottom Sheet */}
      {mobileFilterOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 sm:hidden"
            onClick={() => setMobileFilterOpen(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 sm:hidden flex flex-col max-h-[70vh] animate-slide-up">
            <div className="flex justify-center pt-3 pb-1 bg-white rounded-t-2xl">
              <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
            </div>
            <div className="flex items-center justify-between px-4 py-4 bg-white border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <SlidersHorizontal size={18} aria-hidden="true" />
                Filters
              </h2>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-xl"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto bg-white px-4 py-4 pb-20 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                <select
                  value={selectedCategory || ''}
                  onChange={(e) => setSelectedCategory(e.target.value || null)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Stock Level</label>
                <div className="space-y-2">
                  {['all', 'low', 'out'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => {
                        setStockFilter(filter as any);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-colors ${
                        stockFilter === filter
                          ? 'bg-primary-600 text-white'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>
                        {filter === 'all' ? 'All Stock Levels' : filter === 'low' ? 'Low Stock' : 'Out of Stock'}
                      </span>
                      {stockFilter === filter && <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-sm">✓</div>}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                <div className="space-y-2">
                  {['all', 'active', 'coming_soon', 'draft', 'archived'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => {
                        setStatusFilter(filter as any);
                        setMobileFilterOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-colors ${
                        statusFilter === filter
                          ? 'bg-primary-600 text-white'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>
                        {filter === 'all' ? 'All Statuses' :
                         filter === 'active' ? 'Active' :
                         filter === 'coming_soon' ? 'Coming Soon' :
                         filter === 'draft' ? 'Draft' : 'Archived'}
                      </span>
                      {statusFilter === filter && <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-sm">✓</div>}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Add/Edit Product Modal */}
      {isAdding && (
        <ProductFormModal
          product={newProduct}
          categories={categories}
          isEditing={!!editingProduct}
          onChange={setNewProduct}
          onSubmit={handleFormSubmit}
          onClose={closeForm}
        />
      )}

      {/* Products Display */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 sm:p-12 text-center">
          <Package size={48} className="text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No products found</h3>
          <p className="text-slate-500 mb-4">
            {search || selectedCategory || stockFilter !== 'all'
              ? 'Try adjusting your filters or search term'
              : 'Add your first product to get started'}
          </p>
          {!search && !selectedCategory && stockFilter === 'all' && (
            <button
              onClick={openAddForm}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors"
            >
              <Plus size={20} />
              Add Your First Product
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Mobile Grid View - 2 columns */}
          <div className="grid grid-cols-2 gap-2 sm:hidden">
            {filteredProducts.map((product) => (
              <ProductCompactCard
                key={product.id}
                product={product}
                category={categories.find((c) => c.id === product.categoryId)}
                onEdit={openEditForm}
                onDelete={handleDelete}
                onToggleFeatured={toggleFeatured}
                isTogglingFeatured={togglingFeatured === product.id}
              />
            ))}
          </div>

          {/* Desktop Grid View */}
          {viewMode === 'grid' && (
            <div className="hidden sm:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  category={categories.find((c) => c.id === product.categoryId)}
                  onEdit={openEditForm}
                  onDelete={handleDelete}
                  onToggleFeatured={toggleFeatured}
                  isTogglingFeatured={togglingFeatured === product.id}
                />
              ))}
            </div>
          )}

          {/* Desktop List View */}
          {viewMode === 'list' && (
            <div className="hidden sm:block bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Price</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Featured</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredProducts.map((product) => (
                    <ProductTableRow
                      key={product.id}
                      product={product}
                      category={categories.find((c) => c.id === product.categoryId)}
                      onEdit={openEditForm}
                      onDelete={handleDelete}
                      onToggleFeatured={toggleFeatured}
                      isTogglingFeatured={togglingFeatured === product.id}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Mobile FAB for adding products */}
      <button
        onClick={openAddForm}
        className="sm:hidden fixed bottom-20 right-4 w-14 h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all active:scale-95 z-30"
      >
        <Plus size={24} />
      </button>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal {...props} />
    </div>
  );
}

// ProductCompactCard / ProductCard / ProductTableRow live in components/ProductCards.tsx
// and ProductFormModal in components/ProductFormModal.tsx, so this file stays
// focused on data, state and page composition.
