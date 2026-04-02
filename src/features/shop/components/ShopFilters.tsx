import { Category } from '../../../types';
import { Filter, Search, X } from 'lucide-react';

interface ShopFiltersProps {
  categories: Category[];
  selectedCategory: string | null;
  searchQuery: string;
  onCategoryChange: (categoryId: string | null) => void;
  onSearchChange: (query: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export function ShopFilters({
  categories,
  selectedCategory,
  searchQuery,
  onCategoryChange,
  onSearchChange,
  onClearFilters,
  hasActiveFilters,
}: ShopFiltersProps) {
  return (
    <div className="space-y-6">
      {/* Filter Header */}
      <div className="flex items-center gap-2">
        <Filter size={18} className="text-slate-600" />
        <h2 className="text-lg font-bold text-slate-900">Filters</h2>
      </div>

      {/* Search */}
      <div>
        <label htmlFor="search" className="block text-sm font-medium text-slate-700 mb-2">
          Search Products
        </label>
        <div className="relative">
          <input
            id="search"
            type="text"
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <Search size={18} className="absolute left-3 top-3 text-slate-400" aria-hidden="true" />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-2.5 p-0.5 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Categories */}
      <div>
        <h3 className="text-sm font-medium text-slate-700 mb-3">Categories</h3>
        <ul className="space-y-1">
          <li>
            <button
              onClick={() => onCategoryChange(null)}
              className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors text-sm font-medium flex items-center justify-between group ${
                !selectedCategory
                  ? 'bg-primary-600 text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>All Products</span>
              {!selectedCategory && (
                <X size={16} className="opacity-70" />
              )}
            </button>
          </li>
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <li key={cat.id}>
                <button
                  onClick={() => onCategoryChange(cat.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors text-sm font-medium flex items-center justify-between group ${
                    isActive
                      ? 'bg-primary-600 text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>{cat.name}</span>
                  {isActive && (
                    <X
                      size={16}
                      className="opacity-70"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCategoryChange(null);
                      }}
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Clear Filters Button (Desktop only) */}
      <div className="hidden md:block">
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="w-full py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
          >
            Clear All Filters
          </button>
        )}
      </div>
    </div>
  );
}
