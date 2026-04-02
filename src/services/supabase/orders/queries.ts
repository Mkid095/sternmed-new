/**
 * Orders Service - Query Operations
 *
 * All read operations for orders from the Supabase database.
 * Functions handle fetching orders, items, and statistics.
 *
 * @module orders.queries
 */

import { supabase } from '../../../config/supabase';
import { Order, OrderItem } from '../../../types';
import { OrderRow, OrderItemRow, OrderStats } from './types';
import { fromOrderRow, fromOrderItemRow, enrichOrderWithItems } from './transformers';

/**
 * Fetches all orders from the database
 *
 * Retrieves all orders ordered by creation date (newest first)
 * and includes their associated items.
 *
 * @returns Promise resolving to array of all orders with items
 * @throws Error if database query fails
 *
 * @example
 * const orders = await getAllOrders();
 * console.log(orders.length); // Total orders
 */
export async function getAllOrders(): Promise<Order[]> {
  // Fetch all orders ordered by creation date
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Fetch items for each order and enrich
  const orders = await Promise.all(
    (data || []).map(async (order) => {
      const items = await getOrderItems(order.id);
      return { ...fromOrderRow(order), items };
    })
  );

  return orders;
}

/**
 * Fetches a single order by its ID
 *
 * Retrieves an order with all its items.
 * Returns null if order is not found.
 *
 * @param id - The order ID to fetch
 * @returns Promise resolving to the order with items, or null if not found
 * @throws Error if database query fails (except not found)
 *
 * @example
 * const order = await getOrderById('123e4567-e89b-12d3-a456-426614174000');
 * if (order) {
 *   console.log(order.customerName);
 * }
 */
export async function getOrderById(id: string): Promise<Order | null> {
  // Fetch the order
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .single();

  // Handle not found case
  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }

  // Fetch and attach items
  const items = await getOrderItems(id);
  return { ...fromOrderRow(data), items };
}

/**
 * Fetches all orders for a specific user
 *
 * Retrieves orders belonging to a user, ordered by creation date.
 * Useful for customer order history.
 *
 * @param userId - The user ID to fetch orders for
 * @returns Promise resolving to array of user's orders with items
 * @throws Error if database query fails
 *
 * @example
 * const userOrders = await getOrdersByUserId('user-123');
 */
export async function getOrdersByUserId(userId: string): Promise<Order[]> {
  // Fetch orders for the user
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Fetch items for each order
  const orders = await Promise.all(
    (data || []).map(async (order) => {
      const items = await getOrderItems(order.id);
      return { ...fromOrderRow(order), items };
    })
  );

  return orders;
}

/**
 * Fetches all items for a specific order
 *
 * Retrieves individual line items for an order.
 * Used internally by other query functions.
 *
 * @param orderId - The order ID to fetch items for
 * @returns Promise resolving to array of order items
 * @throws Error if database query fails
 *
 * @example
 * const items = await getOrderItems('order-123');
 * console.log(items.length); // Number of items in order
 */
export async function getOrderItems(orderId: string): Promise<OrderItem[]> {
  const { data, error } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId);

  if (error) throw error;
  return (data || []).map(fromOrderItemRow);
}

/**
 * Fetches order statistics
 *
 * Calculates counts by status and total revenue from paid orders.
 * Useful for dashboard analytics.
 *
 * @returns Promise resolving to order statistics object
 * @throws Error if database query fails
 *
 * @example
 * const stats = await getOrderStats();
 * console.log(stats.totalRevenue); // Total revenue
 */
export async function getOrderStats(): Promise<OrderStats> {
  // Fetch relevant fields from all orders
  const { data, error } = await supabase
    .from('orders')
    .select('status, total, payment_status');

  if (error) throw error;

  // Initialize stats object
  const stats: OrderStats = {
    total: data?.length || 0,
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    totalRevenue: 0,
  };

  // Calculate statistics by iterating through orders
  (data || []).forEach((order) => {
    // Count orders by status
    switch (order.status) {
      case 'pending':
        stats.pending++;
        break;
      case 'processing':
        stats.processing++;
        break;
      case 'shipped':
        stats.shipped++;
        break;
      case 'delivered':
        stats.delivered++;
        break;
      case 'cancelled':
        stats.cancelled++;
        break;
    }

    // Sum revenue from paid orders
    if (order.payment_status === 'paid') {
      stats.totalRevenue += Number(order.total);
    }
  });

  return stats;
}
