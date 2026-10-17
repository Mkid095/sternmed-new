/**
 * Which categories are on the home page — read-only.
 *
 * This used to be the source of the "looking in circles" problem. The landing
 * page split categories into a Visible and a Hidden grid with a "Show on Home"
 * button, writing `categories.show_on_home` — the SAME column the Categories
 * page writes. Change it in one place, open the other, and the two disagree
 * about what is on the home page, with no way to tell which is authoritative.
 *
 * So the control now lives on the Categories page, and this is a status
 * summary that points at it. Nothing here writes.
 *
 * @module CategoryStatusList
 */

import { Link } from 'react-router-dom';
import { clsx } from 'clsx';
import { ArrowRight, Package, Settings2 } from 'lucide-react';
import type { Category } from '../../../../types';

export interface CategoryStatusListProps {
  categories: Array<Category & { productCount?: number }>;
}

export function CategoryStatusList({ categories }: CategoryStatusListProps) {
  const visible = categories.filter((c) => c.showOnHome);

  if (categories.length === 0) {
    return (
      <p className="rounded-xl border border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
        No categories yet.
      </p>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
        <p className="text-sm text-slate-600">
          <span className="font-semibold text-slate-900">{visible.length}</span> of {categories.length}{' '}
          shown on the home page
        </p>
        <Link
          to="/admin/categories"
          className="flex items-center gap-1.5 text-sm font-medium text-primary-600 transition-colors hover:text-primary-700"
        >
          <Settings2 size={14} aria-hidden="true" />
          Choose on Categories
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>

      {visible.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-slate-500">
          No categories are on the home page right now, so the category section will be empty.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {visible.map((category) => {
            const count = category.productCount ?? 0;
            return (
              <li key={category.id} className="flex items-center gap-3 px-4 py-2.5">
                {category.image ? (
                  <img
                    src={category.image}
                    alt=""
                    className="h-8 w-8 flex-shrink-0 rounded-md object-cover"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-md bg-slate-100"
                  >
                    <Package size={15} className="text-slate-400" />
                  </span>
                )}

                <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">
                  {category.name}
                </span>

                <span
                  className={clsx(
                    'shrink-0 text-xs',
                    count === 0 ? 'font-medium text-amber-600' : 'text-slate-500',
                  )}
                >
                  {count === 0 ? 'No products' : `${count} product${count === 1 ? '' : 's'}`}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}