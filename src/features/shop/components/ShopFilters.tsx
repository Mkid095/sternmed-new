/**
 * Shop filter panel, used in the desktop sidebar and the mobile bottom sheet.
 *
 * What changed
 * ------------
 * **The search box is gone from here.** The page already has a search field in
 * its header, visible at every width, and the panel carried a second one. Two
 * inputs bound to the same `?q=` on one screen is not a filter — it is a
 * duplicate that makes it look like they do different things. Search lives in
 * one place; this panel is for categories.
 *
 * **"All Products" no longer has a dismiss button.** It is the default state,
 * not a filter that was applied, so offering to remove it leads to a dead end:
 * dismissing it leaves you in the same state you started in. Every other
 * active category keeps its own clear affordance.
 *
 * Categories now carry a product count, which is what tells you whether a
 * category is worth opening before you click it.
 */

import { Category } from '../../../types';
import { X } from 'lucide-react';

interface ShopFiltersProps {
  categories: Category[];
  selectedCategory: string | null;
  onCategoryChange: (categoryId: string | null) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  /** Visible product count per category id, and the unfiltered total. */
  counts: Record<string, number>;
  totalCount: number;
}

export function ShopFilters({
  categories,
  selectedCategory,
  onCategoryChange,
  onClearFilters,
  hasActiveFilters,
  counts,
  totalCount,
}: ShopFiltersProps) {
  return (
    <>
      <ul className="space-y-0.5">
        <li>
          <CategoryOption
            label="All products"
            count={totalCount}
            active={!selectedCategory}
            onClick={() => onCategoryChange(null)}
          />
        </li>

        {/*
          Every category the dashboard knows about is listed, in the dashboard's
          own order. The list used to drop any category whose products were all
          draft or archived, so a category that simply had nothing published
          vanished from the shop entirely — indistinguishable from it never
          having been created. An empty one is shown with a count of 0 and
          disabled instead, which says "this exists, nothing in it yet".
        */}
        {categories.map((cat) => (
          <li key={cat.id}>
            <CategoryOption
              label={cat.name}
              count={counts[cat.id] ?? 0}
              active={selectedCategory === cat.id}
              disabled={(counts[cat.id] ?? 0) === 0}
              onClick={() => onCategoryChange(cat.id)}
              /* Only a category actually applied can be dismissed. */
              onClear={
                selectedCategory === cat.id ? () => onCategoryChange(null) : undefined
              }
            />
          </li>
        ))}
      </ul>

      {hasActiveFilters && (
        <button
          onClick={onClearFilters}
          className="mt-4 w-full rounded-lg border border-slate-300 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          Clear all filters
        </button>
      )}
    </>
  );
}

interface CategoryOptionProps {
  label: string;
  count: number;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  onClear?: () => void;
}

/**
 * One category row.
 *
 * `aria-pressed` rather than a bare class: this is a toggle group, and the
 * selected state should survive being read aloud.
 */
function CategoryOption({
  label,
  count,
  active,
  disabled = false,
  onClick,
  onClear,
}: CategoryOptionProps) {
  return (
    <div
      className={
        'flex items-center rounded-lg transition-colors ' +
        (active
          ? 'bg-primary-50'
          : disabled
            ? ''
            : 'hover:bg-slate-50')
      }
    >
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        disabled={disabled}
        title={disabled ? `${label} has no products available yet` : undefined}
        className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm disabled:cursor-not-allowed disabled:opacity-45"
      >
        <span
          className={
            'truncate ' +
            (active
              ? 'font-semibold text-primary-700'
              : 'font-medium text-slate-700')
          }
        >
          {label}
        </span>
        <span
          className={
            'flex-shrink-0 text-xs tabular-nums ' +
            (active ? 'text-primary-600' : 'text-slate-400')
          }
        >
          {count}
        </span>
      </button>

      {onClear && (
        <button
          type="button"
          onClick={onClear}
          aria-label={`Clear the ${label} filter`}
          className="mr-1.5 flex-shrink-0 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700"
        >
          <X size={14} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}