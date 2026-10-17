/**
 * Order Stats Grid Component
 *
 * Displays order statistics in a responsive grid of stat cards.
 * Shows total orders, status breakdown, and revenue.
 *
 * @module OrderStatsGrid
 */

import type { ReactNode } from 'react';
import { Package } from 'lucide-react';
import { tone } from '../../../../theme/adminTheme';
import { OrderStats } from '../hooks';

/**
 * Props for OrderStatsGrid component
 */
export interface OrderStatsGridProps {
  /** Order statistics to display */
  stats: OrderStats;
}

/**
 * One figure in the row.
 *
 * Local to this page on purpose. The shared `StatCard` it replaced assumed a
 * four-column layout, so squeezing seven figures plus a currency total into it
 * truncated revenue to "Ksh 0....". Here the label sits above the value with
 * room to breathe, and money is never clipped.
 */
function Figure({
  label,
  value,
  toneName = 'slate',
  icon,
}: {
  label: string;
  value: string | number;
  toneName?: keyof typeof tone;
  icon?: ReactNode;
}) {
  const t = tone[toneName];

  return (
    <div className="flex min-w-0 items-center gap-2.5">
      {icon && (
        <span className={`grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg ${t.bg} ${t.fg}`}>
          {icon}
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-slate-500">{label}</p>
        {/* No truncate on the value. Revenue is the widest figure here and is
            the one thing on this row that must never be cut short. */}
        <p className="mt-0.5 text-lg font-semibold leading-tight tracking-tight tabular-nums text-slate-900">
          {value}
        </p>
      </div>
    </div>
  );
}

/**
 * Order stats row
 *
 * Bespoke to this page: seven figures, so a scrollable single row on wide
 * screens rather than the shared grid, which could not hold this many columns
 * without clipping. Status figures use the shared status palette so a
 * "pending" order looks the same here as it does on the order detail panel.
 *
 * @example
 * <OrderStatsGrid stats={orderStats} />
 */
export function OrderStatsGrid({ stats }: OrderStatsGridProps) {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4 lg:grid-cols-7">
      <Figure label="Total" value={stats.total} icon={<Package size={15} />} />
      <Figure label="Pending" value={stats.pending} toneName="amber" />
      <Figure label="Processing" value={stats.processing} toneName="blue" />
      <Figure label="Shipped" value={stats.shipped} toneName="purple" />
      <Figure label="Delivered" value={stats.delivered} toneName="emerald" />
      <Figure label="Cancelled" value={stats.cancelled} toneName="red" />
      <Figure
        label="Revenue"
        value={`Ksh ${stats.totalRevenue.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`}
        toneName="primary"
      />
    </div>
  );
}
