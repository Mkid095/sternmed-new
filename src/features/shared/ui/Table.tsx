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

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  iconColor?: string;
  iconBg?: string;
  color?: 'slate' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'emerald' | 'orange';
}

const colorMap: Record<string, { iconColor: string; iconBg: string; borderColor: string; shadowColor: string }> = {
  slate: { iconColor: 'text-slate-600', iconBg: 'bg-slate-100', borderColor: 'border-slate-200', shadowColor: 'shadow-slate-100' },
  blue: { iconColor: 'text-primary-600', iconBg: 'bg-primary-50', borderColor: 'border-primary-100', shadowColor: 'shadow-primary-100' },
  green: { iconColor: 'text-emerald-600', iconBg: 'bg-emerald-50', borderColor: 'border-emerald-200', shadowColor: 'shadow-emerald-100' },
  yellow: { iconColor: 'text-amber-600', iconBg: 'bg-amber-50', borderColor: 'border-amber-200', shadowColor: 'shadow-amber-100' },
  red: { iconColor: 'text-red-600', iconBg: 'bg-red-50', borderColor: 'border-red-200', shadowColor: 'shadow-red-100' },
  purple: { iconColor: 'text-purple-600', iconBg: 'bg-purple-50', borderColor: 'border-purple-200', shadowColor: 'shadow-purple-100' },
  emerald: { iconColor: 'text-emerald-600', iconBg: 'bg-emerald-50', borderColor: 'border-emerald-200', shadowColor: 'shadow-emerald-100' },
  orange: { iconColor: 'text-accent-600', iconBg: 'bg-accent-50', borderColor: 'border-accent-200', shadowColor: 'shadow-accent-100' },
};

export function StatCard({
  title,
  value,
  icon,
  iconColor,
  iconBg,
  color
}: StatCardProps) {
  const colors = color ? colorMap[color] : {
    iconColor: iconColor || 'text-primary-600',
    iconBg: iconBg || 'bg-primary-50',
    borderColor: 'border-primary-100',
    shadowColor: 'shadow-primary-100'
  };

  return (
    <div className={`bg-white p-4 sm:p-6 rounded-xl border ${colors.borderColor} ${colors.shadowColor} shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4`}>
      {icon && (
        <div className={`p-3 sm:p-4 ${colors.iconBg} ${colors.iconColor} rounded-2xl flex-shrink-0`}>
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs sm:text-sm font-medium text-slate-500 truncate">{title}</p>
        <p className="text-2xl sm:text-3xl font-bold text-slate-900 truncate tracking-tight">{value}</p>
      </div>
    </div>
  );
}
