/**
 * Admin Dashboard
 *
 * Overview of the platform: headline figures, four charts, and the items that
 * need attention.
 *
 * What changed and why
 * --------------------
 * The previous version defined its own `QuickStat`, `ChartCard`, `EmptyChart`
 * and `ActivitySection` inline while `shared/ui` already exported `StatCard`,
 * and a `components/` folder held `StatsGrid` and `ActivityFeed` that were
 * exported but never rendered. The result was three stat-card
 * implementations, two of them dead.
 *
 * The "Quick Overview" section it ended with was not activity at all — it
 * restated the same four numbers as the tiles above it in different words
 * ("42 products in catalog"). It has been replaced with `AttentionList`,
 * which surfaces the things an administrator actually has to act on.
 *
 * Chart colours now come from theme/adminTheme rather than literals, so they
 * track the brand and stay consistent across every admin screen.
 *
 * @module AdminDashboard
 */

import { useCallback, useState } from 'react'
import {
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  ChevronRight,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  LabelList,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useDashboard } from './hooks'
import type { DashboardStats } from './hooks'
import { StatCard, StatRow } from '../../shared/ui/Table'
import { ChartCard, ChartEmpty, sharedTooltipProps } from '../../shared/ui/ChartCard'
import {
  chartGrid,
  chartHeight,
  chartSeries,
  formatAxisKsh,
  formatCompactKsh,
  space,
} from '../../../theme/adminTheme'

/** Beyond this a ranked bar list stops being scannable; the rest fold away. */
const MAX_RANKED_CATEGORIES = 8;

/** Room for the longest category name before it needs to be cut. */
const CATEGORY_AXIS_WIDTH = 168;

/** Keeps a category name on one axis line. */
function truncateCategoryName(name: string): string {
  return name.length > 26 ? `${name.slice(0, 25)}…` : name;
}

/**
 * Height for the category ranking.
 *
 * Grows with the row count so bars never squash together, but is floored at the
 * standard chart height so a one-category catalogue does not leave a small
 * chart next to a full-height one.
 */
function rankedCategoryHeight(count: number): number {
  return Math.max(chartHeight, Math.min(count, MAX_RANKED_CATEGORIES) * 25 + 12);
}

export default function AdminDashboard() {
  const { stats, monthlyData, categoryData, loading, error, refresh } = useDashboard()
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await refresh()
    } finally {
      setRefreshing(false)
    }
  }, [refresh])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center gap-3 text-slate-500">
        <span
          className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
        <span className="text-sm">Loading dashboard…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div
        role="alert"
        className="flex flex-col items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-6 py-10 text-center"
      >
        <AlertTriangle className="text-red-500" size={24} />
        <p className="text-sm font-medium text-red-700">Could not load dashboard data</p>
        <p className="max-w-[46ch] text-xs text-red-600">{error}</p>
        <button
          onClick={handleRefresh}
          className="mt-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col pb-10" style={{ gap: space.loose }}>
      <DashboardHeader onRefresh={handleRefresh} refreshing={refreshing} />

      {/* Headline figures. One surface, hairline separators — not four cards. */}
      <StatRow>
        <StatCard
          title="Products in catalogue"
          value={stats.products}
          icon={<Package size={18} />}
          color="blue"
        />
        <StatCard
          title="Orders"
          value={stats.orders}
          icon={<ShoppingCart size={18} />}
          color="orange"
          // No hint here. The pending count also appears in the attention list
          // directly below, which links through to the orders — showing the same
          // number twice on one screen adds noise without making the work easier.
        />
        <StatCard title="Registered users" value={stats.users} icon={<Users size={18} />} color="emerald" />
        <StatCard
          title="Total revenue"
          value={formatCompactKsh(stats.revenue)}
          icon={<DollarSign size={18} />}
          color="purple"
        />
      </StatRow>

      <AttentionList stats={stats} />

      {/*
        Two charts, not four.

        "Orders trend" and "Revenue trend" were separate panels built from the
        SAME rows over the SAME six months, so they rendered as two visually
        identical single spikes — the same fact drawn twice. "Revenue this
        week" was a seven-day window on a store that has taken three orders in
        eight months: it held a full panel to say "nothing", and would keep
        doing so.

        So orders and revenue now share one panel on two axes, and the weekly
        window is gone. The category ranking stays because it answers something
        the tiles cannot — what the catalogue actually contains. Revenue is on
        the left axis because it is the number that matters; order count sits
        on the right where the unit difference is explicit.
      */}
      <div className="grid grid-cols-1 gap-8 border-t border-slate-200 pt-8 lg:grid-cols-2">
        <ChartCard title="Trading" subtitle="Revenue and orders, last 6 months">
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={chartHeight}>
              <ComposedChart data={monthlyData} margin={{ top: 4, right: 4, bottom: 0, left: -6 }}>
                <defs>
                  <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chartSeries[0]} stopOpacity={0.22} />
                    <stop offset="100%" stopColor={chartSeries[0]} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGrid.grid} vertical={false} />
                <XAxis dataKey="name" stroke={chartGrid.axis} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis
                  yAxisId="revenue"
                  stroke={chartGrid.axis}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatAxisKsh}
                />
                <YAxis
                  yAxisId="orders"
                  orientation="right"
                  stroke={chartGrid.axis}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  width={34}
                />
                <Tooltip
                  {...sharedTooltipProps}
                  formatter={(value: number, name: string) => [
                    name === 'revenue' ? formatCompactKsh(value) : value.toLocaleString(),
                    name === 'revenue' ? 'Revenue' : 'Orders',
                  ]}
                />
                <Area
                  yAxisId="revenue"
                  type="monotone"
                  dataKey="revenue"
                  stroke={chartSeries[0]}
                  strokeWidth={2}
                  fill="url(#revenueFill)"
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line
                  yAxisId="orders"
                  type="monotone"
                  dataKey="orders"
                  stroke={chartSeries[1]}
                  strokeWidth={2}
                  strokeDasharray="4 3"
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <ChartEmpty
              message="No trading yet"
              hint="Revenue and order counts appear here once orders start coming in."
            />
          )}
        </ChartCard>

        <ChartCard title="Products by category" subtitle="Top of the catalogue">
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={rankedCategoryHeight(categoryData.length)}>
              {/* Horizontal bars, not a donut.
                  This was a pie with ten unlabelled slices and no legend: the
                  largest category was sage green rather than brand blue, several
                  slices shared a hue, and nothing told the reader what any slice
                  was. Ten wedges cannot be told apart by eye. Naming each
                  category on the axis makes the same data readable at a glance,
                  and the ordering makes the ranking itself visible. */}
              <BarChart
                data={categoryData.slice(0, MAX_RANKED_CATEGORIES)}
                layout="vertical"
                margin={{ top: 0, right: 24, bottom: 0, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={chartGrid.grid} horizontal={false} />
                <XAxis type="number" hide allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke={chartGrid.axis}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={CATEGORY_AXIS_WIDTH}
                  interval={0}
                  // One line per label. Recharts wrapped long category names onto
                  // a second line, which produced a ragged right-aligned stack
                  // ("Surgical Drape / Pack") and doubled the row height. The
                  // untruncated name is in the tooltip.
                  tickFormatter={truncateCategoryName}
                />
                <Tooltip
                  {...sharedTooltipProps}
                  formatter={(value: number, name: string) => [
                    `${value} product${value === 1 ? '' : 's'}`,
                    name,
                  ]}
                />
                <Bar
                  dataKey="value"
                  radius={[0, 5, 5, 0]}
                  maxBarSize={14}
                  // Single-hue: every bar is the brand colour because the bar
                  // LENGTH already encodes the value. Tinting by category
                  // implied the colour meant something.
                  fill={chartSeries[0]}
                >
                  {/* The value axis is hidden, so without this the only way to
                      read a count is to hover each bar. */}
                  <LabelList
                    dataKey="value"
                    position="right"
                    fill="var(--color-slate-500)"
                    fontSize={12}
                    formatter={(value: number) => String(value)}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ChartEmpty
              message="No products categorised"
              hint="Assign a category to a product and it will appear here."
            />
          )}
        </ChartCard>
      </div>
    </div>
  )
}

interface DashboardHeaderProps {
  onRefresh: () => Promise<void>
  refreshing: boolean
}

/**
 * Page subheader.
 *
 * Deliberately carries no heading of its own. `AdminLayout` already renders the
 * page title in its header bar, so this previously produced "Admin Dashboard"
 * in the bar and "Dashboard" directly beneath it — the same title twice, one
 * heading level apart, on every page load.
 */
function DashboardHeader({ onRefresh, refreshing }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-500">How the store is doing right now.</p>

      <button
        onClick={onRefresh}
        disabled={refreshing}
        aria-label="Refresh dashboard data"
        className="inline-flex h-9 flex-shrink-0 items-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60"
      >
        <RefreshCw size={15} className={refreshing ? 'animate-spin' : undefined} aria-hidden="true" />
        {refreshing ? 'Refreshing…' : 'Refresh'}
      </button>
    </div>
  )
}

interface AttentionListProps {
  stats: DashboardStats
}

/**
 * Replaces the old "Quick Overview", which repeated the four headline numbers
 * back at the reader in different words and told them nothing they had not
 * just read. Only renders when there is genuinely something to do, and every
 * row links to the page where the work happens — a list that says "3 orders
 * awaiting processing" but does not take you to the orders is an announcement,
 * not a shortcut.
 */
function AttentionList({ stats }: AttentionListProps) {
  const items: Array<{
    key: string
    label: string
    detail: string
    tone: 'warning' | 'info'
    to: string
  }> = []

  if (stats.pendingOrders > 0) {
    items.push({
      key: 'pending',
      label: `${stats.pendingOrders} order${stats.pendingOrders === 1 ? '' : 's'} awaiting processing`,
      detail: 'Confirm payment and dispatch before the next working day.',
      tone: 'warning',
      to: '/admin/orders',
    })
  }

  if (stats.products === 0) {
    items.push({
      key: 'catalogue',
      label: 'Catalogue is empty',
      detail: 'Add products so customers can browse and order.',
      tone: 'info',
      to: '/admin/products',
    })
  }

  if (stats.emails > 0) {
    items.push({
      key: 'unread',
      label: `${stats.emails} unread message${stats.emails === 1 ? '' : 's'} in the site inbox`,
      detail: 'Enquiries sent through the contact form land here.',
      tone: 'info',
      to: '/admin/mails',
    })
  }

  if (items.length === 0) return null

  return (
    <section aria-label="Needs attention" className="flex items-stretch gap-3.5">
      <span
        aria-hidden="true"
        className="w-[3px] flex-shrink-0 rounded-full"
        style={{ backgroundColor: 'var(--color-accent-500)' }}
      />

      <div className="min-w-0 flex-1">
        <h3 className="text-[15px] font-semibold text-slate-900">Needs attention</h3>
        <ul className="mt-1.5 flex flex-col gap-1.5">
          {items.map((item) => (
            <li key={item.key}>
              <Link
                to={item.to}
                className="group -mx-2 flex items-center gap-2.5 rounded-lg px-2 py-1 transition-colors hover:bg-white"
              >
                <AlertTriangle
                  size={14}
                  aria-hidden="true"
                  className="flex-shrink-0"
                  style={{
                    color:
                      item.tone === 'warning'
                        ? 'var(--color-accent-600)'
                        : 'var(--color-primary)',
                  }}
                />
                <span className="min-w-0 flex-1 truncate text-sm text-slate-700">
                  <span className="font-medium text-slate-900">{item.label}</span>
                  <span className="hidden text-slate-500 sm:inline"> — {item.detail}</span>
                </span>
                <ChevronRight
                  size={15}
                  aria-hidden="true"
                  className="flex-shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-400"
                />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}