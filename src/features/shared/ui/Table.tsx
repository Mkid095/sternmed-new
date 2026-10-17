/**
 * Data table with a card fallback for small screens.
 *
 * `StatCard` and `StatRow` used to live here. They were removed: a single
 * shared figure-tile shape forced every admin page into the same four-column
 * grid, and the orders page — which has seven figures — could not lay out
 * without truncating its revenue figure to "Ksh 0....".
 *
 * Each page now arranges its own figures and picks colour from the `tone` map in
 * theme/adminTheme, so the palette stays consistent without the layout being
 * imposed.
 */

import { ReactNode } from 'react';
import { clsx } from 'clsx';

export interface Column<T> {
  key: string;
  header: string;
  cell: (item: T) => ReactNode;
  className?: string;
  mobileOnly?: boolean;
  desktopOnly?: boolean;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyFn: (item: T) => string;
  emptyMessage?: string;
  className?: string;
  showMobileCards?: boolean;
}

export function Table<T>({ data, columns, keyFn, emptyMessage = 'No data found', className, showMobileCards = true }: TableProps<T>) {
  // Filter columns based on visibility
  const visibleColumns = columns.filter(col => !col.desktopOnly);
  const desktopColumns = columns.filter(col => !col.mobileOnly);

  if (data.length === 0) {
    return (
      <div className={clsx('bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden', className)}>
        <div className="px-6 py-12 text-center text-slate-500">
          <p>{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx('bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden', className)}>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {desktopColumns.map((column) => (
                <th
                  key={column.key}
                  className={clsx('px-4 lg:px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500', column.className)}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {data.map((item) => (
              <tr key={keyFn(item)} className="hover:bg-slate-50 transition-colors">
                {desktopColumns.map((column) => (
                  <td key={column.key} className={clsx('px-4 lg:px-6 py-4 text-sm text-slate-900', column.className)}>
                    {column.cell(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      {showMobileCards && (
        <div className="md:hidden divide-y divide-slate-200">
          {data.map((item) => (
            <div key={keyFn(item)} className="p-4 hover:bg-slate-50 transition-colors">
              {visibleColumns.map((column) => (
                <div key={column.key} className="mb-3 last:mb-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    {column.header}
                  </p>
                  <div className="text-sm text-slate-900">{column.cell(item)}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}