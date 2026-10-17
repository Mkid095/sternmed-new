/**
 * Products toolbar: search, filters, and the grid/list switch.
 *
 * Split out of AdminProducts.tsx, which had grown past 1000 lines.
 *
 * What was wrong with the version this replaces:
 *
 * - Each filter select drew its chevron as a literal "⌄" character in a div.
 *   It is a text glyph, not an icon: it rendered at a different size on each
 *   platform, sat at a slightly different height than a real icon would, and
 *   had no accessible name. Three of them, three different-looking carets.
 * - The search icon was 20px inside a field whose text is 14px, with padding
 *   tuned for neither, so it floated rather than centring.
 * - The grid/list switch was a grey track with a white shadowed pill and no
 *   pressed state, so a screen reader could not tell which view was active.
 *
 * @module ProductToolbar
 */

import { useId, type ReactNode } from 'react';
import { Search, X, ChevronDown, SlidersHorizontal, LayoutGrid, Rows3 } from 'lucide-react';
import { clsx } from 'clsx';
import type { Category, ProductStatus } from '../../../../types';

interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}

/**
 * A labelled select with a real chevron.
 *
 * The native select is kept (it gives correct keyboard behaviour and a real
 * dropdown on every platform) and only its chrome is replaced: appearance-none
 * strips the platform arrow, and a 14px ChevronDown is positioned over the
 * right edge with a matching text colour.
 */
function FilterSelect({ label, value, onChange, children }: FilterSelectProps) {
  const id = useId();

  return (
    <div className="relative">
      {/*
        Visually hidden rather than placeholder-only: "All Categories" is a
        *value*, not a label, so a screen reader heard no indication of what
        the control filtered by.
      */}
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={clsx(
          'w-full appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8',
          'text-sm text-slate-700 transition-colors',
          'hover:border-slate-300 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/25',
        )}
      >
        {children}
      </select>
      <ChevronDown
        size={14}
        aria-hidden="true"
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
      />
    </div>
  );
}

interface ProductToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  categories: Category[];
  selectedCategory: string | null;
  onCategoryChange: (value: string) => void;
  stockFilter: 'all' | 'low' | 'out';
  onStockFilterChange: (value: 'all' | 'low' | 'out') => void;
  statusFilter: ProductStatus | 'all';
  onStatusFilterChange: (value: ProductStatus | 'all') => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (value: 'grid' | 'list') => void;
  resultCount: number;
  totalCount: number;
  isFiltered: boolean;
  onClearFilters: () => void;
}

export function ProductToolbar({
  search,
  onSearchChange,
  categories,
  selectedCategory,
  onCategoryChange,
  stockFilter,
  onStockFilterChange,
  statusFilter,
  onStatusFilterChange,
  viewMode,
  onViewModeChange,
  resultCount,
  totalCount,
  isFiltered,
  onClearFilters,
}: ProductToolbarProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {/* Search grows to fill the row; the filters keep their intrinsic width. */}
        <div className="relative min-w-0 flex-1">
          <Search
            size={15}
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search products"
            aria-label="Search products"
            className={clsx(
              'w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 text-sm text-slate-900',
              'placeholder:text-slate-400 transition-colors',
              'hover:border-slate-300 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/25',
              // Leave room for the clear button, but only when there is one.
              search ? 'pr-9' : 'pr-3',
            )}
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="hidden shrink-0 gap-2 sm:flex">
          <div className="w-40">
            <FilterSelect
              label="Filter by category"
              value={selectedCategory ?? ''}
              onChange={(v) => onCategoryChange(v)}
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </FilterSelect>
          </div>

          <div className="w-36">
            <FilterSelect
              label="Filter by stock level"
              value={stockFilter}
              onChange={(v) => onStockFilterChange(v as 'all' | 'low' | 'out')}
            >
              <option value="all">All stock</option>
              <option value="low">Low stock</option>
              <option value="out">Out of stock</option>
            </FilterSelect>
          </div>

          <div className="w-36">
            <FilterSelect
              label="Filter by status"
              value={statusFilter}
              onChange={(v) => onStatusFilterChange(v as ProductStatus | 'all')}
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="coming_soon">Coming soon</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </FilterSelect>
          </div>

          {/* Segmented control. A flat track with no shadow — the selected
              segment is distinguished by weight and background, not by being
              lifted, which made the control look like it contained a button
              floating over another. */}
          <div
            role="group"
            aria-label="View mode"
            className="flex shrink-0 items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5"
          >
            <button
              type="button"
              onClick={() => onViewModeChange('grid')}
              aria-pressed={viewMode === 'grid'}
              aria-label="Grid view"
              className={clsx(
                'grid h-8 w-9 place-items-center rounded-md transition-colors',
                viewMode === 'grid'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600',
              )}
            >
              <LayoutGrid size={15} />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('list')}
              aria-pressed={viewMode === 'list'}
              aria-label="List view"
              className={clsx(
                'grid h-8 w-9 place-items-center rounded-md transition-colors',
                viewMode === 'list'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600',
              )}
            >
              <Rows3 size={15} />
            </button>
          </div>
        </div>

        </div>

      {/*
        Only shown when a filter is active. Unfiltered, the page header already
        states the total, and repeating "42 products" directly underneath it
        just adds a line that says nothing.
      */}
      {isFiltered && (
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span>
            {resultCount} of {totalCount} products
          </span>
          <button
            type="button"
            onClick={onClearFilters}
            className="inline-flex items-center gap-1 font-medium text-primary-600 transition-colors hover:text-primary-700"
          >
            <SlidersHorizontal size={12} aria-hidden="true" />
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}