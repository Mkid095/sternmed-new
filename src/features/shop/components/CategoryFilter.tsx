import { Category } from '../../../types';
import { Filter, Search } from 'lucide-react';

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string | null;
  searchQuery: string;
  onCategoryChange: (categoryId: string | null) => void;
  onSearchChange: (query: string) => void;
}

export function CategoryFilter({
  categories,
  selectedCategory,
  searchQuery,
  onCategoryChange,
  onSearchChange,
}: CategoryFilterProps) {
  return (
    <aside className="w-full md:w-64 flex-shrink-0">
      <div className="bg-white p-6 rounded-md border border-slate-200 md:sticky md:top-24">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Filter size={18} /> Filters
        </h2>

        <div className="mb-6">
          <label htmlFor="search" className="block text-sm font-medium text-slate-700 mb-2">Search</label>
          <div className="relative">
            <input
              id="search"
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
            <Search size={16} className="absolute left-3 top-2.5 text-slate-400" aria-hidden="true" />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-slate-700 mb-3">Categories</h3>
          <ul className="space-y-2 max-h-[300px] md:max-h-[calc(100vh-250px)] overflow-y-auto">
            <li>
              <button
                onClick={() => onCategoryChange(null)}
                className={`text-sm w-full text-left px-2 py-1 rounded-md transition-colors ${
                  !selectedCategory ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                All Products
              </button>
            </li>
            {categories.map((cat) => (
              <li key={cat.id}>
                <button
                  onClick={() => onCategoryChange(cat.id)}
                  className={`text-sm w-full text-left px-2 py-1 rounded-md transition-colors ${
                    selectedCategory === cat.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {cat.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
}
