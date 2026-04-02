/**
 * Orders Service - Main Export
 *
 * Central service for all order-related database operations.
 * Exports a unified API combining queries, mutations, and utilities.
 *
 * @module orders.service
 */

import { Order, OrderItem, OrderStatus } from '../../../types';

// Import all operations from sub-modules
export * from './types';
export * from './transformers';
export * from './queries';
export * from './mutations';

/**
 * Orders Service API
 *
 * Unified interface for all order operations.
 * Combines query and mutation functions into a single object.
 *
 * @example
 * import { ordersService } from '@/services/supabase/orders';
 *
 * // Query operations
 * const orders = await ordersService.getAllOrders();
 * const order = await ordersService.getOrderById('123');
 *
 * // Mutation operations
 * const newOrder = await ordersService.createOrder(orderData);
 * await ordersService.updateOrderStatus('123', 'shipped');
 */
export const ordersService = {
  // ============================================================
  // QUERY OPERATIONS
  // ============================================================

  /**
   * Fetch all orders with their items
   */
  getAllOrders: async () => {
    const { getAllOrders } = await import('./queries');
    return getAllOrders();
  },

  /**
   * Fetch a single order by ID
   */
  getOrderById: async (id: string) => {
    const { getOrderById } = await import('./queries');
    return getOrderById(id);
  },

  /**
   * Fetch all orders for a specific user
   */
  getOrdersByUserId: async (userId: string) => {
    const { getOrdersByUserId } = await import('./queries');
    return getOrdersByUserId(userId);
  },

  /**
   * Fetch items for a specific order
   */
  getOrderItems: async (orderId: string) => {
    const { getOrderItems } = await import('./queries');
    return getOrderItems(orderId);
  },

  /**
   * Get order statistics
   */
  getOrderStats: async () => {
    const { getOrderStats } = await import('./queries');
    return getOrderStats();
  },

  // ============================================================
  // MUTATION OPERATIONS
  // ============================================================

  /**
   * Create a new order with items
   */
  createOrder: async (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => {
    const { createOrder } = await import('./mutations');
    return createOrder(order);
  },

  /**
   * Update order status
   */
  updateOrderStatus: async (id: string, status: OrderStatus) => {
    const { updateOrderStatus } = await import('./mutations');
    return updateOrderStatus(id, status);
  },

  /**
   * Update payment status
   */
  updatePaymentStatus: async (id: string, paymentStatus: string) => {
    const { updatePaymentStatus } = await import('./mutations');
    return updatePaymentStatus(id, paymentStatus);
  },

  /**
   * Delete an order
   */
  deleteOrder: async (id: string) => {
    const { deleteOrder } = await import('./mutations');
    return deleteOrder(id);
  },

  /**
   * Update order fields
   */
  updateOrder: async (
    id: string,
    updates: Partial<Omit<Order, 'id' | 'createdAt' | 'updatedAt'>>
  ) => {
    const { updateOrder } = await import('./mutations');
    return updateOrder(id, updates);
  },
};

/**
 * Default export for backward compatibility
 */
export default ordersService;
