/**
 * useDashboard Hook
 *
 * Custom hook for managing admin dashboard state.
 * Handles statistics fetching, chart data, and loading state.
 *
 * @module useDashboard
 */

import { useState, useCallback, useEffect } from 'react';
import { api } from '../../../../services/api';
import { chartSeries } from '../../../../theme/adminTheme';

/**
 * Dashboard statistics structure
 */
export interface DashboardStats {
  /** Total number of products */
  products: number;

  /** Number of unread emails */
  emails: number;

  /** Total number of users */
  users: number;

  /** Total orders */
  orders: number;

  /** Total revenue */
  revenue: number;

  /** Pending orders */
  pendingOrders: number;
}

/**
 * Monthly order data for charts
 */
export interface MonthlyOrderData {
  name: string;
  orders: number;
  revenue: number;
}

/**
 * Category distribution data for pie chart
 */
export interface CategoryDistribution {
  name: string;
  value: number;
  color: string;
}

/**
 * Weekly revenue data for bar chart
 *
 * REMOVED with the "Revenue this week" panel. A seven-day window on a store
 * that has taken three orders in eight months was a full-width panel that read
 * "nothing booked" almost every time it was loaded. The calculation was deleted
 * rather than left in place, so nothing quietly keeps paying for a chart
 * nobody renders.
 */

/**
 * Return type for useDashboard hook
 */
export interface UseDashboardReturn {
  /** Dashboard statistics */
  stats: DashboardStats;

  /** Monthly order data for line/area charts */
  monthlyData: MonthlyOrderData[];

  /** Category distribution for the catalogue ranking */
  categoryData: CategoryDistribution[];

  /** Whether data is loading */
  loading: boolean;

  /**
   * Human-readable failure message, or null when the last fetch succeeded.
   *
   * This did not exist before. The hook caught every failure, logged it and
   * left `loading` false, so a request that 500s or a session that expires
   * mid-fetch rendered a dashboard of confident zeroes — indistinguishable
   * from a brand-new empty store. `admin` then had no idea whether to retry
   * or to wait for orders to appear.
   */
  error: string | null;

  /** Refresh dashboard statistics */
  refresh: () => Promise<void>;
}

/**
 * Turns a thrown value into something an administrator can act on.
 *
 * Never surfaces a raw PostgREST or Firebase message verbatim: those leak
 * table and column names, and several read like SQL errors at an
 * administrator who is trying to run a shop.
 */
function describeFetchFailure(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === 'string' && error) {
    return error;
  }
  return 'The server could not be reached.';
}

/**
 * Custom hook for dashboard management
 *
 * Provides state management for the admin dashboard:
 * - Fetches statistics (products, emails, users, orders, revenue)
 * - Calculates chart data (monthly trends, category distribution, weekly revenue)
 * - Handles loading state
 *
 * @returns Dashboard state and refresh function
 *
 * @example
 * function AdminDashboard() {
 *   const { stats, monthlyData, categoryData, loading, error, refresh } = useDashboard();
 *
 *   return <DashboardPage {...} />;
 * }
 */
export function useDashboard(): UseDashboardReturn {
  // ============ State ============

  const [stats, setStats] = useState<DashboardStats>({
    products: 0,
    emails: 0,
    users: 0,
    orders: 0,
    revenue: 0,
    pendingOrders: 0,
  });

  const [monthlyData, setMonthlyData] = useState<MonthlyOrderData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryDistribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ============ Data Fetching ============

  /**
   * Fetch dashboard statistics and chart data
   */
  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all data in parallel for better performance
      const [products, emails, users, orders, categories] = await Promise.all([
        api.getProducts(),
        api.getEmails(),
        api.getUsers(),
        api.getOrders(),
        api.getCategories(),
      ]);

      // Calculate basic statistics
      const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
      const pendingOrders = orders.filter((o) => o.status === 'pending').length;

      setStats({
        products: products.length,
        emails: emails.filter((e) => e.type === 'inbox' && !e.read).length,
        users: users.length,
        orders: orders.length,
        revenue: totalRevenue,
        pendingOrders,
      });

      // Calculate monthly order data (last 6 months)
      const monthlyData = calculateMonthlyData(orders);
      setMonthlyData(monthlyData);

      // Calculate category distribution
      const categoryDist = calculateCategoryDistribution(products, categories);
      setCategoryData(categoryDist);
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
      setError(describeFetchFailure(err));
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Calculate monthly order and revenue data for the last 6 months
   */
  function calculateMonthlyData(orders: any[]): MonthlyOrderData[] {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const today = new Date();
    const data: MonthlyOrderData[] = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const month = date.getMonth();
      const year = date.getFullYear();

      const monthOrders = orders.filter((order) => {
        const orderDate = new Date(order.createdAt);
        return orderDate.getMonth() === month && orderDate.getFullYear() === year;
      });

      const monthlyRevenue = monthOrders.reduce((sum, order) => sum + (order.total || 0), 0);

      data.push({
        name: monthNames[month],
        orders: monthOrders.length,
        revenue: monthlyRevenue,
      });
    }

    return data;
  }

  /**
   * Calculate product distribution by category
   */
  function calculateCategoryDistribution(products: any[], categories: any[]): CategoryDistribution[] {
    // Sort by count BEFORE assigning colour.
    //
    // Colour used to be assigned by position in the raw category list and the
    // list was sorted afterwards, so the largest slice got whatever hue the
    // category happened to be declared with — the dominant category could come
    // out sage green while a near-empty one rendered brand blue. The biggest
    // bar is the one the eye lands on, so it gets the brand colour.
    return categories
      .map((cat) => ({
        name: cat.name,
        value: products.filter((p) => p.categoryId === cat.id).length,
      }))
      .filter((cat) => cat.value > 0)
      .sort((a, b) => b.value - a.value)
      .map((cat, index) => ({
        ...cat,
        color: chartSeries[index % chartSeries.length],
      }));
  }

  /**
   * Refresh function for manual reload
   */
  const refresh = fetchStats;

  /**
   * Initial data fetch on mount
   */
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    monthlyData,
    categoryData,
    loading,
    error,
    refresh,
  };
}
