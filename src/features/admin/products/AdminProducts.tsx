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
  Grid3x3,
  List,
  Star,
  Package,
  AlertTriangle,
  Edit,
  Trash2,
  Filter
} from 'lucide-react';
import { Product, Category, ProductStatus } from '../../../types';
import { ImageUpload, MultiImageUpload, ConfirmationModal, useConfirmationModal, useToastSuccess, useToastError } from '../../shared/ui';
import { api } from '../../../services/api';

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

  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock < 20).length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;

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

      console.log('Creating product with data:', productData);

      if (editingProduct) {
        await api.updateProduct(editingProduct.id, productData);
        showSuccess('Product updated successfully');
      } else {
        await api.createProduct(productData);
        showSuccess('Product added successfully');
      }

      closeForm();
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Products</h1>
            <p className="text-sm text-slate-500 mt-1">{products.length} products total</p>
          </div>
          <button
            onClick={openAddForm}
            className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors shadow-sm"
          >
            <Plus size={20} />
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
              <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                <X size={16} className="text-red-600 flex-shrink-0" />
                <span className="text-sm font-medium text-red-700">
                  {outOfStockCount} out of stock
                </span>
              </div>
            )}
          </div>
        )}

        {/* Search and Filters Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search products..."
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

          <button
            onClick={() => setMobileFilterOpen(true)}
            className={`sm:hidden flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-colors ${
              (selectedCategory || stockFilter !== 'all')
                ? 'bg-primary-600 text-white'
                : 'bg-white border border-slate-200 text-slate-700'
            }`}
          >
            <SlidersHorizontal size={20} />
            Filters
          </button>

          <div className="hidden sm:block relative">
            <select
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value || null)}
              className="appearance-none pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-medium"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              ⌄
            </div>
          </div>

          <div className="hidden sm:block relative">
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as any)}
              className="appearance-none pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-medium"
            >
              <option value="all">All Stock Levels</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              ⌄
            </div>
          </div>

          <div className="hidden sm:block relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="appearance-none pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="coming_soon">Coming Soon</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              ⌄
            </div>
          </div>

          <div className="hidden sm:flex items-center bg-slate-100 rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500'
              }`}
            >
              <Grid3x3 size={20} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500'
              }`}
            >
              <List size={20} />
            </button>
          </div>
        </div>
      </div>

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
                <Filter size={20} />
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
            <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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

/**
 * Product Compact Card Component (Mobile - 3 per row)
 */
interface ProductCompactCardProps {
  key?: Key;
  product: Product;
  category?: Category;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onToggleFeatured: (id: string, status: boolean) => void;
  isTogglingFeatured?: boolean;
}

function ProductCompactCard({ product, category, onEdit, onDelete, onToggleFeatured, isTogglingFeatured = false }: ProductCompactCardProps) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
      <div className="relative aspect-square bg-slate-100 flex-shrink-0">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />

        {/* Status Badge - Top Left */}
        {product.status === 'coming_soon' && (
          <div className="absolute top-0 left-0 bg-blue-500 text-white px-1.5 py-0.5 rounded-br-lg flex items-center gap-0.5">
            <span className="text-[9px] font-bold leading-tight">Coming Soon</span>
          </div>
        )}
        {product.status === 'draft' && (
          <div className="absolute top-0 left-0 bg-slate-500 text-white px-1.5 py-0.5 rounded-br-lg flex items-center gap-0.5">
            <span className="text-[9px] font-bold leading-tight">Draft</span>
          </div>
        )}
        {product.status === 'archived' && (
          <div className="absolute top-0 left-0 bg-gray-700 text-white px-1.5 py-0.5 rounded-br-lg flex items-center gap-0.5">
            <span className="text-[9px] font-bold leading-tight">Archived</span>
          </div>
        )}

        {/* Featured Badge - Top Right */}
        {product.isFeatured && product.status === 'active' && (
          <div className="absolute top-0 right-0 bg-accent-500 text-white px-1.5 py-0.5 rounded-bl-lg flex items-center gap-0.5">
            <Star size={8} fill="currentColor" />
            <span className="text-[9px] font-bold leading-tight">Featured</span>
          </div>
        )}

        {/* Stock Overlay */}
        {product.stock === 0 && product.status === 'active' && (
          <div className="absolute bottom-0 left-0 right-0 bg-red-500 text-white text-[9px] font-bold text-center py-0.5">
            OUT OF STOCK
          </div>
        )}
        {product.stock > 0 && product.stock < 20 && product.status === 'active' && (
          <div className="absolute bottom-0 left-0 right-0 bg-accent-500 text-white text-[9px] font-bold text-center py-0.5">
            LOW: {product.stock}
          </div>
        )}
      </div>

      <div className="p-1.5 flex flex-col flex-1 min-h-0">
        <h3 className="font-semibold text-slate-900 text-[10px] line-clamp-2 leading-tight flex-1">{product.name}</h3>
        <p className="text-xs font-bold text-primary-600 mt-0.5">Ksh {product.price.toLocaleString()}</p>

        {/* Action Buttons - 2 rows to prevent overflow */}
        <div className="grid grid-cols-3 gap-0.5 mt-1.5">
          <button
            onClick={() => onToggleFeatured(product.id, product.isFeatured)}
            disabled={isTogglingFeatured}
            className={`p-1 rounded transition-colors flex items-center justify-center ${
              product.isFeatured
                ? 'bg-accent-100 text-accent-700'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            } ${isTogglingFeatured ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={product.isFeatured ? 'Remove from featured' : 'Add to featured'}
          >
            {isTogglingFeatured ? (
              <div className="h-3 w-3 border-2 border-t-transparent border-slate-600 rounded-full animate-spin" />
            ) : (
              <Star size={12} fill={product.isFeatured ? 'currentColor' : 'none'} />
            )}
          </button>
          <button
            onClick={() => onEdit(product)}
            className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded transition-colors flex items-center justify-center"
            title="Edit product"
          >
            <Edit size={12} />
          </button>
          <button
            onClick={() => onDelete(product.id)}
            className="p-1 bg-red-50 hover:bg-red-100 text-red-600 rounded transition-colors flex items-center justify-center"
            title="Delete product"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Product Card Component (Desktop Grid View)
 */
function ProductCard({ product, category, onEdit, onDelete, onToggleFeatured, isTogglingFeatured = false }: ProductCompactCardProps) {
  const getStatusLabel = (status: ProductStatus) => {
    switch (status) {
      case 'coming_soon': return 'Coming Soon';
      case 'draft': return 'Draft';
      case 'archived': return 'Archived';
      default: return '';
    }
  };

  const getStatusColor = (status: ProductStatus) => {
    switch (status) {
      case 'coming_soon': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'draft': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'archived': return 'bg-gray-200 text-gray-700 border-gray-300';
      default: return '';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative aspect-video bg-slate-100">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />

        {/* Status Badge - Top Left */}
        {product.status !== 'active' && (
          <div className={`absolute top-2 left-2 px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm border ${getStatusColor(product.status)}`}>
            <span className="text-xs font-bold">{getStatusLabel(product.status)}</span>
          </div>
        )}

        {/* Featured Badge - Top Right */}
        {product.isFeatured && product.status === 'active' && (
          <div className="absolute top-2 right-2 bg-accent-500 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm">
            <Star size={12} fill="currentColor" />
            <span className="text-xs font-bold">Featured</span>
          </div>
        )}

        {/* Stock Badge - Bottom Left (only for active products) */}
        {product.status === 'active' && (
          <div className={`absolute bottom-2 left-2 px-2.5 py-1 rounded-lg text-xs font-medium border ${
            product.stock === 0 ? 'bg-red-100 text-red-700 border-red-200' :
            product.stock < 20 ? 'bg-accent-50 text-accent-700 border-accent-200' :
            'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}>
            {product.stock === 0 ? 'Out of stock' : product.stock < 20 ? `Low (${product.stock})` : `${product.stock} in stock`}
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-slate-900 line-clamp-1">{product.name}</h3>
        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{product.description}</p>

        <div className="flex items-center justify-between mt-3">
          <div>
            <p className="text-lg font-bold text-primary-600">Ksh {product.price.toLocaleString()}</p>
            <p className="text-xs text-slate-400">{category?.name || 'Uncategorized'}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-1">
            <button
              onClick={() => onToggleFeatured(product.id, product.isFeatured)}
              disabled={isTogglingFeatured}
              className={`p-2 rounded-lg transition-colors ${
                product.isFeatured
                  ? 'bg-accent-100 text-accent-700'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              } ${isTogglingFeatured ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={product.isFeatured ? 'Remove from featured' : 'Add to featured'}
            >
              {isTogglingFeatured ? (
                <div className="h-4 w-4 border-2 border-t-transparent border-slate-600 rounded-full animate-spin" />
              ) : (
                <Star size={18} fill={product.isFeatured ? 'currentColor' : 'none'} />
              )}
            </button>
            <button
              onClick={() => onEdit(product)}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
              title="Edit product"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={() => onDelete(product.id)}
              className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
              title="Delete product"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Product Table Row Component (Desktop List View)
 */
function ProductTableRow({ product, category, onEdit, onDelete, onToggleFeatured, isTogglingFeatured = false }: ProductCompactCardProps) {
  const getStatusBadge = (status: ProductStatus) => {
    switch (status) {
      case 'coming_soon':
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">Coming Soon</span>;
      case 'draft':
        return <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-full">Draft</span>;
      case 'archived':
        return <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs font-medium rounded-full">Archived</span>;
      default:
        return null;
    }
  };

  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 relative">
            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            {product.isFeatured && product.status === 'active' && (
              <div className="absolute -top-1 -left-1 w-5 h-5 bg-accent-500 rounded-full flex items-center justify-center">
                <Star size={10} fill="white" />
              </div>
            )}
          </div>
          <div>
            <div className="font-medium text-slate-900 flex items-center gap-2">
              {product.name}
              {product.status !== 'active' && getStatusBadge(product.status)}
              {product.isFeatured && product.status === 'active' && (
                <span className="px-2 py-0.5 bg-accent-100 text-accent-700 text-[10px] font-bold rounded-full">Featured</span>
              )}
            </div>
            <div className="text-xs text-slate-500 truncate max-w-[200px]">{product.description}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-slate-600">{category?.name || 'Uncategorized'}</td>
      <td className="px-4 py-3 text-sm font-semibold text-slate-900">Ksh {product.price.toLocaleString()}</td>
      <td className="px-4 py-3">
        {product.status === 'active' ? (
          <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${
            product.stock === 0 ? 'bg-red-100 text-red-700' : product.stock < 20 ? 'bg-accent-50 text-accent-700' : 'bg-emerald-50 text-emerald-700'
          }`}>
            {product.stock === 0 ? 'Out of stock' : product.stock < 20 ? `Low (${product.stock})` : `${product.stock} in stock`}
          </span>
        ) : (
          <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${
            product.status === 'coming_soon' ? 'bg-blue-100 text-blue-700' :
            product.status === 'draft' ? 'bg-slate-100 text-slate-700' :
            'bg-gray-200 text-gray-700'
          }`}>
            {product.status === 'coming_soon' ? 'Coming Soon' :
             product.status === 'draft' ? 'Draft' :
             'Archived'}
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        <button
          onClick={() => onToggleFeatured(product.id, product.isFeatured)}
          disabled={isTogglingFeatured}
          className={`p-2 rounded-lg transition-colors ${
            product.isFeatured
              ? 'bg-accent-100 text-accent-700'
              : 'bg-slate-100 text-slate-400 hover:text-accent-600 hover:bg-slate-200'
          } ${isTogglingFeatured ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={product.isFeatured ? 'Remove from featured' : 'Add to featured'}
        >
          {isTogglingFeatured ? (
            <div className="h-4 w-4 border-2 border-t-transparent border-slate-600 rounded-full animate-spin" />
          ) : (
            <Star size={18} fill={product.isFeatured ? 'currentColor' : 'none'} />
          )}
        </button>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex justify-end gap-1">
          <button onClick={() => onEdit(product)} className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="Edit">
            <Edit size={16} />
          </button>
          <button onClick={() => onDelete(product.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
}

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
