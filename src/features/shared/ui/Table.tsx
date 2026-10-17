import React, { ReactNode } from 'react';
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
  /** Secondary line under the value — e.g. "3 awaiting processing". */
  hint?: string;
  /** Tints the hint to draw the eye. */
  hintTone?: 'default' | 'warning' | 'success';
}

/**
 * Colour belongs on the icon, and only the icon.
 *
 * An earlier version gave every tile its own coloured border, so four figures
 * read as four unrelated objects rather than one set — a patchwork of blue,
 * amber, green and purple outlines around otherwise identical boxes.
 */
const colorMap: Record<string, { iconColor: string; iconBg: string }> = {
  slate: { iconColor: 'text-slate-600', iconBg: 'bg-slate-100' },
  blue: { iconColor: 'text-primary-600', iconBg: 'bg-primary-50' },
  green: { iconColor: 'text-emerald-600', iconBg: 'bg-emerald-50' },
  yellow: { iconColor: 'text-amber-600', iconBg: 'bg-amber-50' },
  red: { iconColor: 'text-red-600', iconBg: 'bg-red-50' },
  purple: { iconColor: 'text-purple-600', iconBg: 'bg-purple-50' },
  emerald: { iconColor: 'text-emerald-600', iconBg: 'bg-emerald-50' },
  orange: { iconColor: 'text-accent-600', iconBg: 'bg-accent-50' },
};

const hintToneClass = {
  default: 'text-slate-500',
  warning: 'text-accent-600',
  success: 'text-emerald-600',
} as const;

/**
 * Headline figure.
 *
 * NOT a card: no border, no shadow, no rounded box, no hover lift. A tile that
 * lifts on hover implies it can be clicked, and these are read-only figures.
 * `StatRow` supplies the single surface and the hairline dividers, so the group
 * reads as one row of related numbers rather than four floating boxes.
 */
export function StatCard({
  title,
  value,
  icon,
  iconColor,
  iconBg,
  color,
  hint,
  hintTone = 'default',
}: StatCardProps) {
  const tones = color
    ? colorMap[color]
    : { iconColor: iconColor || 'text-primary-600', iconBg: iconBg || 'bg-primary-50' };

  return (
    <div className="flex min-w-0 items-start gap-3.5 px-5 py-4 sm:px-6 sm:py-5">
      {icon && (
        <div className={`grid h-10 w-10 flex-shrink-0 place-items-center rounded-lg ${tones.iconBg} ${tones.iconColor}`}>
          {icon}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-slate-500">{title}</p>
        {/* The figure leads. A small muted label above it means the number is
            the first thing read, and the label still fits on one line. */}
        <p className="mt-0.5 truncate text-[26px] font-semibold leading-tight tracking-tight text-slate-900 tabular-nums">
          {value}
        </p>
        {hint && <p className={clsx('mt-0.5 truncate text-xs font-medium', hintToneClass[hintTone])}>{hint}</p>}
      </div>
    </div>
  );
}

/**
 * Lays figures out in one group with hairline separators.
 *
 * No outer border or background: the admin canvas is already white, so a
 * bordered white box would be invisible structure pretending to be visible.
 * The vertical rules are what divide the figures. Below the sm breakpoint the
 * row stacks and the rules run horizontally instead, so the group still reads
 * as one set in either direction.
 */
export function StatRow({ children, className }: { children: ReactNode; className?: string }) {
  const cells = React.Children.toArray(children).filter(Boolean);

  return (
    <div className={clsx('grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-2 sm:divide-y-0 xl:grid-cols-4', className)}>
      {cells.map((cell, index) => (
        <div
          key={index}
          className={clsx(
            'min-w-0',
            // Column rules only once the cells sit side by side, and never
            // after the last one — a trailing rule past the final figure would
            // hang off the edge of the group for no reason.
            index > 0 && 'sm:border-l sm:border-slate-100',
            index === cells.length - 1 && 'xl:border-l-0'
          )}
        >
          {cell}
        </div>
      ))}
    </div>
  );
}
