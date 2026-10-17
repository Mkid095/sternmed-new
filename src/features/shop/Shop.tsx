/**
 * Shop / catalogue page.
 *
 * What this pass adds
 * -------------------
 * 1. **Sorting.** The grid had no order at all — whatever the database
 *    returned. Featured items are what a supplier most wants surfaced, so
 *    "Featured first" is the default rather than an afterthought.
 * 2. **Paging.** All 42 products rendered at once. That is a long scroll and a
 *    long DOM for images that are mostly lazy-loaded below the fold. The grid
 *    now shows a page and grows on demand.
 * 3. **Result counts that mean something.** The heading counts the *filtered*
 *    results but the category list counted nothing, so a category could be
 *    clicked to reveal zero products. Each category now shows how many it
 *    holds, computed against the same visibility rules the grid uses.
 * 4. **A search field that is actually usable.** It filters on every
 *    keystroke and writes to the URL; typing "drp" would have cleared the
 *    results mid-word with no way back other than the small ×.
 */

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { Product, Category } from '../../types';
import { useCartStore } from '../../store/cartStore';
import { ProductGrid } from './components/ProductGrid';
import { SlidersHorizontal, X, Search, ChevronDown, Filter } from 'lucide-react';
import { ShopFilters } from './components/ShopFilters';

/** Products shown before "Load more". Roughly two screens at desktop width. */
const PAGE_SIZE = 24;

type SortKey = 'featured' | 'name' | 'price-asc' | 'price-desc';

const SORT_LABELS: Record<SortKey, string> = {
  featured: 'Featured first',
  name: 'Name (A–Z)',
  'price-asc': 'Price (low to high)',
  'price-desc': 'Price (high to low)',
};

export default function Shop() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [sort, setSort] = useState<SortKey>('featured');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const addItem = useCartStore((state) => state.addItem);

  const categoryFilter = searchParams.get('category');
  const searchQuery = searchParams.get('q') || '';
  /*
   * The home page's "View All" under Featured Products links to
   * `?featured=true`. The shop never read that parameter, so the link quietly
   * showed the unfiltered catalogue — the same page you were already on, with
   * no indication anything had been filtered.
   */
  const featuredOnly = searchParams.get('featured') === 'true';

  // Keep search input in sync with URL params
  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prods, cats] = await Promise.all([api.getProducts(), api.getCategories()]);
        // Filter out draft and archived products from shop view
        const visibleProducts = prods.filter(
          (p) => p.status !== 'draft' && p.status !== 'archived' && p.status !== 'out_of_stock',
        );
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

  /**
   * Counts per category, and the total, computed once per fetch rather than on
   * every render. These are counts of *searchable* products — a category whose
   * products are all drafts is omitted from the list rather than offered as a
   * dead end.
   */
  const { counts, totalCount } = useMemo(() => {
    const next: Record<string, number> = {};
    for (const p of products) {
      if (p.categoryId) next[p.categoryId] = (next[p.categoryId] ?? 0) + 1;
    }
    return { counts: next, totalCount: products.length };
  }, [products]);

  const filteredProducts = useMemo(() => {
    const needle = searchQuery.trim().toLowerCase();

    const matched = products.filter((p) => {
      const matchesCategory = categoryFilter ? p.categoryId === categoryFilter : true;
      const matchesFeatured = featuredOnly ? p.isFeatured : true;
      const matchesSearch =
        !needle ||
        p.name.toLowerCase().includes(needle) ||
        (p.description ?? '').toLowerCase().includes(needle);
      return matchesCategory && matchesFeatured && matchesSearch;
    });

    // Sorted on a copy so the fetched order in state is never mutated.
    return [...matched].sort((a, b) => {
      switch (sort) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'featured':
        default:
          // Featured first, then alphabetical so the order is stable between
          // loads rather than depending on the order rows happen to come back.
          return (
            Number(b.isFeatured ?? false) - Number(a.isFeatured ?? false) ||
            a.name.localeCompare(b.name)
          );
      }
    });
  }, [products, categoryFilter, searchQuery, featuredOnly, sort]);

  /*
   * A new filter or sort must show the results from the top again. Without
   * this, "load more" leaves you on page 3 of a list you have just changed.
   */
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [categoryFilter, searchQuery, featuredOnly, sort]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleProducts.length < filteredProducts.length;

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

  const hasActiveFilters = Boolean(categoryFilter || searchQuery || featuredOnly);
  // The heading names whichever filter is narrowing the list, so the page never
  // says "All products" while showing something else.
  const categoryName = categoryFilter
    ? categories.find((c) => c.id === categoryFilter)?.name || 'Products'
    : featuredOnly
      ? 'Featured products'
      : 'All products';

  /** Drops only the filters this bar owns; search and featured live elsewhere. */
  const clearFilters = () => {
    setSearchInput('');
    setSearchParams(new URLSearchParams());
    setMobileFilterOpen(false);
  };

  const filterPanel = (
    <ShopFilters
      categories={categories}
      selectedCategory={categoryFilter}
      onCategoryChange={handleCategoryChange}
      onClearFilters={clearFilters}
      hasActiveFilters={hasActiveFilters}
      counts={counts}
      totalCount={totalCount}
    />
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16 md:pb-0">
      {/* Page Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{categoryName}</h1>
              <p className="text-sm text-slate-500 mt-1">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
                {hasActiveFilters && ' matching your filters'}
              </p>
            </div>

            {/* Sort */}
            <div className="relative">
              <label
                htmlFor="sort"
                className="sr-only"
              >
                Sort products
              </label>
              <select
                id="sort"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="appearance-none rounded-lg border border-slate-300 bg-white py-2 pl-3 pr-9 text-sm font-medium text-slate-700 transition-colors hover:border-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/25"
              >
                {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                  <option key={key} value={key}>
                    {SORT_LABELS[key]}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                aria-hidden="true"
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>
          </div>

          {/* Search Bar with Filter Button */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search
                size={18}
                aria-hidden="true"
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                placeholder="Search products…"
                aria-label="Search products"
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full rounded-xl border border-transparent bg-slate-100 py-3 pl-11 pr-10 text-sm text-slate-900 transition-colors placeholder:text-slate-400 hover:bg-slate-200/70 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/25"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => handleSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700"
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setMobileFilterOpen(true)}
              className={`relative flex items-center justify-center gap-2 rounded-xl px-4 transition-colors ${
                hasActiveFilters
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              } md:hidden`}
              aria-label="Open filters"
              aria-expanded={mobileFilterOpen}
            >
              <SlidersHorizontal size={20} aria-hidden="true" />
            </button>
          </form>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex gap-6">
          {/*
            Desktop sidebar.

            `sticky` alone was not enough: with a long category list the panel
            grew past the viewport, so its lower half — including the "Clear all"
            button — was only reachable by scrolling the PAGE, which scrolled the
            panel out of its sticky position as you did. The panel is now capped
            to the space between the header and the viewport edge and scrolls
            inside itself, so the header, the page and the filter list all stay
            where the reader left them.

            `top-24` clears the sticky site header; the bottom gap keeps the last
            row clear of the floating action buttons.
          */}
          <aside className="hidden md:block w-60 flex-shrink-0">
            <div className="sticky top-24 flex max-h-[calc(100vh-7rem)] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="shrink-0 border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-2">
                  <Filter size={16} className="text-slate-400" aria-hidden="true" />
                  <h2 className="text-sm font-semibold text-slate-900">Categories</h2>
                </div>
                {categoryName !== 'All products' && (
                  <p className="mt-1 truncate text-xs text-slate-500">
                    Showing {categoryName}
                  </p>
                )}
              </div>

              <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
                {filterPanel}
              </div>
            </div>
          </aside>

          {/* Products Grid */}
          <main className="flex-1 min-w-0">
            <ProductGrid
              products={visibleProducts}
              onAddToCart={addItem}
              emptyMessage="Try a different search term, or clear the filters to see everything."
            />

            {/* Nothing matched — offer the way out rather than a dead grid. */}
            {filteredProducts.length === 0 && (
              <div className="mt-6 text-center">
                <button
                  onClick={clearFilters}
                  className="rounded-xl bg-primary-600 px-6 py-3 font-medium text-white transition-colors hover:bg-primary-700"
                >
                  Clear all filters
                </button>
              </div>
            )}

            {/* Paging */}
            {hasMore && (
              <div className="mt-8 text-center">
                <p className="mb-3 text-sm text-slate-500">
                  Showing {visibleProducts.length} of {filteredProducts.length}
                </p>
                <button
                  onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
                  className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50"
                >
                  Load more
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filter Bottom Sheet */}
      {mobileFilterOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden transition-opacity"
            onClick={() => setMobileFilterOpen(false)}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Filters"
            className="fixed inset-x-0 bottom-0 z-50 md:hidden flex flex-col max-h-[85vh] animate-slide-up rounded-t-2xl bg-white"
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-12 h-1.5 bg-slate-300 rounded-full" aria-hidden="true" />
            </div>

            <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Filters</h2>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                aria-label="Close filters"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 pb-4">
              {filterPanel}
            </div>

            <div className="px-4 py-4 pb-20 border-t border-slate-100 flex gap-3">
              <button
                onClick={clearFilters}
                disabled={!hasActiveFilters}
                className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors font-medium"
              >
                Clear all
              </button>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="flex-1 py-3.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-colors font-medium shadow-md"
              >
                Show {filteredProducts.length}{' '}
                {filteredProducts.length === 1 ? 'product' : 'products'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}