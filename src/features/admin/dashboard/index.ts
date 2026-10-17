/**
 * Dashboard Barrel Export
 *
 * `StatsGrid` and `ActivityFeed` were previously exported here. Both were
 * dead: no page imported either, and `AdminDashboard` had its own inline
 * `QuickStat` and `ActivitySection` instead. Three stat-tile implementations
 * shipped in one feature folder, two of them never rendered.
 *
 * Headline figures now come from `shared/ui` `StatCard`, and chart chrome from
 * `shared/ui` `ChartCard`, so there is exactly one of each.
 */

export { default as AdminDashboard } from './AdminDashboard';
export { useDashboard } from './hooks';
export type {
  DashboardStats,
  MonthlyOrderData,
  CategoryDistribution,
  UseDashboardReturn,
} from './hooks';