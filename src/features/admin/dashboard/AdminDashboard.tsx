/**
 * Admin Dashboard Page
 *
 * Main dashboard page for administrators.
 * Shows overview statistics and recent activity with charts.
 *
 * @module AdminDashboard
 */

import type { ReactNode } from 'react';
import { TrendingUp, Package, ShoppingCart, Users, DollarSign, Activity, Clock } from 'lucide-react';
import { useDashboard } from './hooks';
import type { DashboardStats, MonthlyOrderData, CategoryDistribution, WeeklyRevenue } from './hooks';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

/**
 * Admin Dashboard Page Component
 *
 * Provides overview of the platform with charts:
 * - Orders trend line chart
 * - Product categories pie chart
 * - Revenue bar chart
 * - Quick stats cards
 *
 * @example
 * <Route path="/admin" element={<AdminDashboard />} />
 */
export default function AdminDashboard() {
  const { stats, monthlyData, categoryData, weeklyRevenue, loading, refresh } = useDashboard();

  // ============ Loading State ============

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Loading dashboard...</div>
      </div>
    );
  }

  // Format revenue for display
  const formatRevenue = (amount: number) => {
    if (amount >= 1000000) return `Ksh ${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `Ksh ${(amount / 1000).toFixed(0)}K`;
    return `Ksh ${amount.toFixed(0)}`;
  };

  // ============ Main Layout ============

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <DashboardHeader onRefresh={refresh} />

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <QuickStat
          title="Total Products"
          value={stats.products}
          icon={<Package size={20} />}
          color="primary"
        />
        <QuickStat
          title="Total Orders"
          value={stats.orders}
          icon={<ShoppingCart size={20} />}
          color="accent"
          badge={stats.pendingOrders > 0 ? `${stats.pendingOrders} pending` : undefined}
        />
        <QuickStat
          title="Active Users"
          value={stats.users}
          icon={<Users size={20} />}
          color="secondary"
        />
        <QuickStat
          title="Total Revenue"
          value={formatRevenue(stats.revenue)}
          icon={<DollarSign size={20} />}
          color="purple"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Orders Trend Chart */}
        <ChartCard title="Orders Trend" subtitle="Last 6 months">
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2596be" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2596be" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === 'orders') return [value, 'Orders'];
                    if (name === 'revenue') return [formatRevenue(value), 'Revenue'];
                    return [value, name];
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="orders"
                  stroke="#2596be"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorOrders)"
                  name="Orders"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="No order data available yet" />
          )}
        </ChartCard>

        {/* Categories Pie Chart */}
        <ChartCard title="Products by Category" subtitle="Distribution">
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                  fontSize={11}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="No product data available yet" />
          )}
        </ChartCard>

        {/* Revenue Chart */}
        <ChartCard title="Weekly Revenue" subtitle="This week">
          {weeklyRevenue.length > 0 && weeklyRevenue.some(d => d.amount > 0) ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={weeklyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                  formatter={(value: number) => [formatRevenue(value), 'Revenue']}
                />
                <Bar
                  dataKey="amount"
                  fill="#f59e0b"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="No revenue data this week" />
          )}
        </ChartCard>

        {/* Revenue Trend Line Chart */}
        <ChartCard title="Revenue Trend" subtitle="Last 6 months">
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                  formatter={(value: number) => [formatRevenue(value), 'Revenue']}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#6b9080"
                  strokeWidth={2}
                  dot={{ fill: '#6b9080', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Revenue"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="No revenue data available yet" />
          )}
        </ChartCard>
      </div>

      {/* Activity Section */}
      <ActivitySection stats={stats} />
    </div>
  );
}

/**
 * Dashboard page header
 */
interface DashboardHeaderProps {
  onRefresh: () => Promise<void>;
}

function DashboardHeader({ onRefresh }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Dashboard Overview
        </h2>
        <p className="text-sm sm:text-base text-slate-500 mt-1">
          Welcome back! Here's what's happening with your store today.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700"
        >
          <Clock size={16} />
          Refresh
        </button>
      </div>
    </div>
  );
}

/**
 * Quick Stat Card Component
 */
interface QuickStatProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  color: 'primary' | 'accent' | 'secondary' | 'purple';
  badge?: string;
}

function QuickStat({ title, value, icon, color, badge }: QuickStatProps) {
  const colorMap = {
    primary: { bg: 'bg-primary-50', text: 'text-primary-600', border: 'border-primary-100' },
    accent: { bg: 'bg-accent-50', text: 'text-accent-600', border: 'border-accent-100' },
    secondary: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
  };

  const colors = colorMap[color];

  return (
    <div className={`bg-white p-4 sm:p-5 rounded-xl border ${colors.border} shadow-sm hover:shadow-md transition-shadow relative`}>
      {badge && (
        <span className="absolute top-2 right-2 px-2 py-0.5 bg-accent-500 text-white text-[10px] font-bold rounded-full">
          {badge}
        </span>
      )}
      <div className={`p-2.5 ${colors.bg} ${colors.text} rounded-xl w-fit mb-3`}>
        {icon}
      </div>
      <p className="text-2xl sm:text-3xl font-bold text-slate-900">{value}</p>
      <p className="text-xs sm:text-sm text-slate-500 mt-1">{title}</p>
    </div>
  );
}

/**
 * Chart Card Component
 */
interface ChartCardProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

function ChartCard({ title, subtitle, children }: ChartCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6">
      <div className="mb-4">
        <h3 className="text-base sm:text-lg font-bold text-slate-900">{title}</h3>
        <p className="text-xs sm:text-sm text-slate-500">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

/**
 * Empty Chart Component
 */
function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-[280px] text-center">
      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
        <Activity size={28} className="text-slate-300" />
      </div>
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}

/**
 * Activity Section Component
 */
interface ActivitySectionProps {
  stats: {
    products: number;
    orders: number;
    users: number;
    pendingOrders: number;
  };
}

function ActivitySection({ stats }: ActivitySectionProps) {
  const activities = [];

  if (stats.pendingOrders > 0) {
    activities.push({
      icon: <Clock size={18} className="text-accent-600" />,
      text: `${stats.pendingOrders} order${stats.pendingOrders > 1 ? 's' : ''} awaiting processing`,
      color: 'bg-accent-50',
    });
  }

  if (stats.products > 0) {
    activities.push({
      icon: <Package size={18} className="text-primary-600" />,
      text: `${stats.products} products in catalog`,
      color: 'bg-primary-50',
    });
  }

  if (stats.users > 0) {
    activities.push({
      icon: <Users size={18} className="text-emerald-600" />,
      text: `${stats.users} user${stats.users > 1 ? 's' : ''} registered`,
      color: 'bg-emerald-50',
    });
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6">
      <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-4">Quick Overview</h3>
      {activities.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {activities.map((activity, index) => (
            <div key={index} className={`flex items-center gap-3 p-3 rounded-lg ${activity.color}`}>
              {activity.icon}
              <span className="text-sm font-medium text-slate-700">{activity.text}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 sm:py-12 px-4 text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <Activity size={28} className="text-slate-300" />
          </div>
          <p className="text-sm sm:text-base text-slate-500 font-medium mb-1">No recent activity</p>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xs">
            Activity from products, orders, and users will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
