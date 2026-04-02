/**
 * Order Stats Grid Component
 *
 * Displays order statistics in a responsive grid of stat cards.
 * Shows total orders, status breakdown, and revenue.
 *
 * @module OrderStatsGrid
 */

import { Package } from 'lucide-react';
import { StatCard } from '../../../shared/ui';
import { OrderStats } from '../hooks';

/**
 * Props for OrderStatsGrid component
 */
export interface OrderStatsGridProps {
  /** Order statistics to display */
  stats: OrderStats;
}

/**
 * Order stats grid component
 *
 * Displays 7 stat cards in a responsive grid:
 * - Total orders
 * - Pending, Processing, Shipped, Delivered, Cancelled counts
 * - Total revenue from paid orders
 *
 * Responsive behavior:
 * - Mobile: 2 columns
 * - Small screens: 3 columns
 * - Large screens: 4 columns
 * - Extra large screens: 7 columns (all visible)
 *
 * @example
 * <OrderStatsGrid stats={orderStats} />
 */
export function OrderStatsGrid({ stats }: OrderStatsGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
      {/* Total Orders */}
      <StatCard
        title="Total"
        value={stats.total}
        icon={<Package size={18} />}
        color="slate"
      />

      {/* Pending Orders */}
      <StatCard
        title="Pending"
        value={stats.pending}
        color="yellow"
      />

      {/* Processing Orders */}
      <StatCard
        title="Processing"
        value={stats.processing}
        color="blue"
      />

      {/* Shipped Orders */}
      <StatCard
        title="Shipped"
        value={stats.shipped}
        color="purple"
      />

      {/* Delivered Orders */}
      <StatCard
        title="Delivered"
        value={stats.delivered}
        color="green"
      />

      {/* Cancelled Orders */}
      <StatCard
        title="Cancelled"
        value={stats.cancelled}
        color="red"
      />

      {/* Total Revenue */}
      <StatCard
        title="Revenue"
        value={`Ksh ${stats.totalRevenue.toFixed(2)}`}
        color="emerald"
      />
    </div>
  );
}
