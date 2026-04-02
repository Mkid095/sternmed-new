import { useEffect, useState, FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { Product, Category } from '../../types';
import { useCartStore } from '../../store/cartStore';
import { ProductGrid } from './components/ProductGrid';
import { SlidersHorizontal, X } from 'lucide-react';
import { ShopFilters } from './components/ShopFilters';

export default function Shop() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const addItem = useCartStore((state) => state.addItem);

  const categoryFilter = searchParams.get('category');
  const searchQuery = searchParams.get('q') || '';

  // Keep search input in sync with URL params
  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prods, cats] = await Promise.all([api.getProducts(), api.getCategories()]);
        // Filter out draft and archived products from shop view
        const visibleProducts = prods.filter((p) => p.status !== 'draft' && p.status !== 'archived' && p.status !== 'out_of_stock');
        setProducts(visibleProducts);
        setCategories(cats);
      } catch (error) {
        console.error('Failed to fetch data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredProducts = products.filter((p) => {
    const matchesCategory = categoryFilter ? p.categoryId === categoryFilter : true;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCategoryChange = (categoryId: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (categoryId) params.set('category', categoryId);
    else params.delete('category');
    setSearchParams(params);
  };

  const handleSearchChange = (query: string) => {
    setSearchInput(query);
    const params = new URLSearchParams(searchParams);
    if (query.trim()) params.set('q', query.trim());
    else params.delete('q');
    setSearchParams(params);
  };

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchInput.trim()) params.set('q', searchInput.trim());
    else params.delete('q');
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchInput('');
    setSearchParams(new URLSearchParams());
    setMobileFilterOpen(false);
  };

  const hasActiveFilters = Boolean(categoryFilter || searchQuery);
  const categoryName = categoryFilter
    ? categories.find((c) => c.id === categoryFilter)?.name || 'Products'
    : 'All Products';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16 md:pb-0">
      {/* Page Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Page Title */}
          <div className="mb-4">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{categoryName}</h1>
            <p className="text-sm text-slate-500 mt-1">{filteredProducts.length} products</p>
          </div>

          {/* Search Bar with Filter Button */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search products..."
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-4 pr-10 py-3 bg-slate-100 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => handleSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label="Clear search"
                >
                  <X size={18} />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setMobileFilterOpen(true)}
              className={`flex items-center justify-center px-4 rounded-xl transition-colors relative shadow-sm ${
                hasActiveFilters
                  ? 'bg-primary-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              aria-label="Open filters"
            >
              <SlidersHorizontal size={20} />
              {hasActiveFilters && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-accent-500 rounded-full"></span>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex gap-6">
          {/* Desktop Sidebar Filter */}
          <aside className="hidden md:block w-64 flex-shrink-0">
            <div className="bg-white rounded-xl border border-slate-200 p-6 sticky top-24">
              <ShopFilters
                categories={categories}
                selectedCategory={categoryFilter}
                searchQuery={searchQuery}
                onCategoryChange={handleCategoryChange}
                onSearchChange={handleSearchChange}
                onClearFilters={clearFilters}
                hasActiveFilters={hasActiveFilters}
              />
            </div>
          </aside>

          {/* Products Grid */}
          <main className="flex-1 min-w-0">
            <ProductGrid
              products={filteredProducts}
              onAddToCart={addItem}
              emptyMessage="Try adjusting your filters or search term"
            />
            {filteredProducts.length === 0 && (
              <div className="mt-8 text-center">
                <button
                  onClick={clearFilters}
                  className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filter Bottom Sheet */}
      {mobileFilterOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
            onClick={() => setMobileFilterOpen(false)}
          />

          {/* Bottom Sheet */}
          <div className="fixed inset-x-0 bottom-0 z-50 md:hidden flex flex-col max-h-[85vh] animate-slide-up">
            {/* Handle Bar */}
            <div className="flex justify-center pt-3 pb-1 bg-white rounded-t-2xl">
              <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 bg-white border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Filters</h2>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                aria-label="Close filters"
              >
                <X size={20} />
              </button>
            </div>

            {/* Filter Content - Scrollable */}
            <div className="flex-1 overflow-y-auto bg-white px-4 py-4 pb-4">
              <ShopFilters
                categories={categories}
                selectedCategory={categoryFilter}
                searchQuery={searchQuery}
                onCategoryChange={handleCategoryChange}
                onSearchChange={handleSearchChange}
                onClearFilters={clearFilters}
                hasActiveFilters={hasActiveFilters}
              />
            </div>

            {/* Footer - Show Results Button */}
            <div className="px-4 py-4 pb-20 bg-white border-t border-slate-100 flex gap-3">
              <button
                onClick={clearFilters}
                disabled={!hasActiveFilters}
                className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors font-medium"
              >
                Clear All
              </button>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="flex-1 py-3.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-colors font-medium shadow-md"
              >
                Show {filteredProducts.length} Products
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
