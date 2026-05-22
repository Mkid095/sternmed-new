/**
 * useOrdersManager Hook
 *
 * Custom hook for managing orders page state and operations.
 * Handles data fetching, filtering, and statistics calculation.
 *
 * @module useOrdersManager
 */

import { useState, useCallback, useEffect } from 'react';
import { api } from '../../../../services/api';
import { Order } from '../../../../types';

/**
 * Order statistics structure
 */
export interface OrderStats {
  /** Total number of orders */
  total: number;

  /** Number of pending orders */
  pending: number;

  /** Number of processing orders */
  processing: number;

  /** Number of shipped orders */
  shipped: number;

  /** Number of delivered orders */
  delivered: number;

  /** Number of cancelled orders */
  cancelled: number;

  /** Total revenue from paid orders */
  totalRevenue: number;
}

/**
 * Order status filter type
 */
export type OrderStatusFilter = 'all' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

/**
 * Return type for useOrdersManager hook
 */
export interface UseOrdersManagerReturn {
  /** All orders */
  orders: Order[];

  /** Currently selected order for detail view */
  selectedOrder: Order | null;

  /** Whether orders are loading */
  loading: boolean;

  /** Search query string */
  search: string;

  /** Current status filter */
  statusFilter: OrderStatusFilter;

  /** Calculated order statistics */
  stats: OrderStats;

  /** Orders filtered by search and status */
  filteredOrders: Order[];

  /** Update search query */
  setSearch: (search: string) => void;

  /** Update status filter */
  setStatusFilter: (filter: OrderStatusFilter) => void;

  /** Set selected order */
  setSelectedOrder: (order: Order | null) => void;

  /** Refresh orders from API */
  refreshOrders: () => Promise<void>;

  /** Handle order status update */
  handleStatusUpdate: (orderId: string, status: string) => Promise<void>;
}

/**
 * Calculate order statistics from orders array
 *
 * Computes:
 * - Total order count
 * - Count by status (pending, processing, shipped, delivered, cancelled)
 * - Total revenue from paid orders
 *
 * @param orders - Array of orders to calculate stats from
 * @returns Calculated statistics
 *
 * @example
 * const stats = calculateOrderStats(orders);
 * // Returns: { total: 100, pending: 20, processing: 15, ... }
 */
export function calculateOrderStats(orders: Order[]): OrderStats {
  return {
    total: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    processing: orders.filter((o) => o.status === 'processing').length,
    shipped: orders.filter((o) => o.status === 'shipped').length,
    delivered: orders.filter((o) => o.status === 'delivered').length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
    totalRevenue: orders
      .filter((o) => o.paymentStatus === 'paid')
      .reduce((sum, o) => sum + o.total, 0),
  };
}

/**
 * Filter orders by search query and status
 *
 * Search matches against:
 * - Customer name (case-insensitive)
 * - Customer email (case-insensitive)
 * - Order ID (case-insensitive)
 *
 * @param orders - Array of orders to filter
 * @param search - Search query string
 * @param statusFilter - Status filter to apply
 * @returns Filtered array of orders
 *
 * @example
 * const filtered = filterOrders(orders, 'john@example.com', 'pending');
 */
export function filterOrders(
  orders: Order[],
  search: string,
  statusFilter: OrderStatusFilter
): Order[] {
  return orders.filter((order) => {
    // Check search match
    const matchesSearch =
      order.customerName.toLowerCase().includes(search.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(search.toLowerCase()) ||
      order.id.toLowerCase().includes(search.toLowerCase());

    // Check status match
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });
}

/**
 * Custom hook for orders page management
 *
 * Provides comprehensive state management for the orders page:
 * - Fetches orders and calculates statistics
 * - Handles search and status filtering
 * - Manages selected order for detail view
 * - Handles status updates with refresh
 *
 * @returns Orders state and handlers
 *
 * @example
 * function AdminOrders() {
 *   const {
 *     orders,
 *     filteredOrders,
 *     stats,
 *     loading,
 *     search,
 *     statusFilter,
 *     setSearch,
 *     setStatusFilter,
 *     setSelectedOrder,
 *     handleStatusUpdate,
 *   } = useOrdersManager();
 *
 *   return <OrdersPage {...} />;
 * }
 */
export function useOrdersManager(): UseOrdersManagerReturn {
  // ============ State ============

  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>('all');
  const [stats, setStats] = useState<OrderStats>({
    total: 0,
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    totalRevenue: 0,
  });

  // ============ Data Fetching ============

  /**
   * Fetch orders from API
   */
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getOrders();
      setOrders(data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Calculate and set order statistics from currently fetched orders
   */
  const computeStats = useCallback((currentOrders: Order[]) => {
    setStats(calculateOrderStats(currentOrders));
  }, []);

  /**
   * Initial data fetch on mount
   */
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Compute stats whenever orders change
  useEffect(() => {
    if (orders.length > 0) {
      computeStats(orders);
    }
  }, [orders, computeStats]);

  // ============ Handlers ============

  /**
   * Refresh orders and recompute stats
   */
  const refreshOrders = useCallback(async () => {
    await fetchOrders();
  }, [fetchOrders]);

  /**
   * Handle order status update
   * Updates order status and refreshes data
   */
  const handleStatusUpdate = useCallback(async (orderId: string, status: string) => {
    try {
      await api.updateOrderStatus(orderId, status as any);
      await refreshOrders();
    } catch (error) {
      console.error('Failed to update order status:', error);
      throw error; // Re-throw to allow caller to handle
    }
  }, [refreshOrders]);

  // ============ Computed Values ============

  /** Orders filtered by current search and status */
  const filteredOrders = filterOrders(orders, search, statusFilter);

  return {
    orders,
    selectedOrder,
    loading,
    search,
    statusFilter,
    stats,
    filteredOrders,
    setSearch,
    setStatusFilter,
    setSelectedOrder,
    refreshOrders,
    handleStatusUpdate,
  };
}
