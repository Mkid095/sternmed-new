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
 */
export interface WeeklyRevenue {
  name: string;
  amount: number;
}

/**
 * Return type for useDashboard hook
 */
export interface UseDashboardReturn {
  /** Dashboard statistics */
  stats: DashboardStats;

  /** Monthly order data for line/area charts */
  monthlyData: MonthlyOrderData[];

  /** Category distribution for pie chart */
  categoryData: CategoryDistribution[];

  /** Weekly revenue for bar chart */
  weeklyRevenue: WeeklyRevenue[];

  /** Whether data is loading */
  loading: boolean;

  /** Refresh dashboard statistics */
  refresh: () => Promise<void>;
}

// Chart colors matching brand theme
const CHART_COLORS = [
  '#17487a', // primary
  '#f59e0b', // accent
  '#6b9080', // secondary
  '#8b5cf6', // purple
  '#ef4444', // red
  '#10b981', // green
  '#f97316', // orange
  '#06b6d4', // cyan
];

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
 *   const { stats, monthlyData, categoryData, weeklyRevenue, loading, refresh } = useDashboard();
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
  const [weeklyRevenue, setWeeklyRevenue] = useState<WeeklyRevenue[]>([]);
  const [loading, setLoading] = useState(true);

  // ============ Data Fetching ============

  /**
   * Fetch dashboard statistics and chart data
   */
  const fetchStats = useCallback(async () => {
    setLoading(true);
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

      // Calculate weekly revenue (current week)
      const weeklyData = calculateWeeklyRevenue(orders);
      setWeeklyRevenue(weeklyData);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
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
    const distribution = categories.map((cat, index) => {
      const count = products.filter((p) => p.categoryId === cat.id).length;
      return {
        name: cat.name,
        value: count,
        color: CHART_COLORS[index % CHART_COLORS.length],
      };
    });

    // Filter out categories with no products and sort by count
    return distribution
      .filter((cat) => cat.value > 0)
      .sort((a, b) => b.value - a.value);
  }

  /**
   * Calculate weekly revenue data (current week)
   */
  function calculateWeeklyRevenue(orders: any[]): WeeklyRevenue[] {
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date();
    const currentDay = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
    monday.setHours(0, 0, 0, 0);

    const data: WeeklyRevenue[] = dayNames.map((day, index) => {
      const dayStart = new Date(monday);
      dayStart.setDate(monday.getDate() + index);

      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const dayOrders = orders.filter((order) => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= dayStart && orderDate <= dayEnd;
      });

      const dayRevenue = dayOrders.reduce((sum, order) => sum + (order.total || 0), 0);

      return {
        name: day,
        amount: dayRevenue,
      };
    });

    // Only show days up to today
    const todayIndex = currentDay === 0 ? 6 : currentDay - 1;
    return data.slice(0, todayIndex + 1);
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
    weeklyRevenue,
    loading,
    refresh,
  };
}
