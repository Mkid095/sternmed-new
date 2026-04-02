/**
 * Orders Service - Mutation Operations
 *
 * All write operations for orders in the Supabase database.
 * Functions handle creating, updating, and deleting orders.
 *
 * @module orders.mutations
 */

import { supabase } from '../../../config/supabase';
import { Order, OrderItem, OrderStatus } from '../../../types';
import { toCreateOrderInput, toCreateOrderItemInputs } from './transformers';
import { getOrderById } from './queries';

/**
 * Creates a new order with its items
 *
 * Handles order creation as a transaction:
 * 1. Creates the order record
 * 2. Creates all associated order items
 * 3. Fetches and returns the complete order
 *
 * @param order - Order data (without id, timestamps)
 * @returns Promise resolving to the created order with items
 * @throws Error if database operation fails
 *
 * @example
 * const newOrder = await createOrder({
 *   customerName: 'John Doe',
 *   customerEmail: 'john@example.com',
 *   items: [...],
 *   // ... other fields
 * });
 */
export async function createOrder(
  order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Order> {
  // Step 1: Create the order record
  const orderInput = toCreateOrderInput(order);
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .insert(orderInput)
    .select()
    .single();

  if (orderError) throw orderError;

  // Step 2: Create order items if provided
  if (order.items && order.items.length > 0) {
    const itemsInput = toCreateOrderItemInputs(orderData.id, order.items);
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(itemsInput);

    if (itemsError) throw itemsError;
  }

  // Step 3: Fetch and return the complete order with items
  return getOrderById(orderData.id);
}

/**
 * Updates the status of an order
 *
 * Changes the order status (e.g., pending -> processing -> shipped).
 *
 * @param id - The order ID to update
 * @param status - The new status value
 * @returns Promise that resolves when update is complete
 * @throws Error if database operation fails
 *
 * @example
 * await updateOrderStatus('order-123', 'shipped');
 */
export async function updateOrderStatus(
  id: string,
  status: OrderStatus
): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', id);

  if (error) throw error;
}

/**
 * Updates the payment status of an order
 *
 * Changes the payment status (e.g., pending -> paid).
 *
 * @param id - The order ID to update
 * @param paymentStatus - The new payment status value
 * @returns Promise that resolves when update is complete
 * @throws Error if database operation fails
 *
 * @example
 * await updatePaymentStatus('order-123', 'paid');
 */
export async function updatePaymentStatus(
  id: string,
  paymentStatus: string
): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .update({ payment_status: paymentStatus })
    .eq('id', id);

  if (error) throw error;
}

/**
 * Deletes an order
 *
 * Permanently removes an order and its items from the database.
 * Use with caution - this operation cannot be undone.
 *
 * @param id - The order ID to delete
 * @returns Promise that resolves when deletion is complete
 * @throws Error if database operation fails
 *
 * @example
 * await deleteOrder('order-123');
 */
export async function deleteOrder(id: string): Promise<void> {
  // Delete the order (cascade should handle order items)
  const { error } = await supabase
    .from('orders')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Updates multiple fields of an order
 *
 * Generic update function for modifying any order fields.
 *
 * @param id - The order ID to update
 * @param updates - Object containing fields to update
 * @returns Promise that resolves when update is complete
 * @throws Error if database operation fails
 *
 * @example
 * await updateOrder('order-123', {
 *   notes: 'Customer requested expedited shipping',
 *   shippingAddress: 'New address'
 * });
 */
export async function updateOrder(
  id: string,
  updates: Partial<Omit<Order, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  // Convert app types to database format
  const updateData: Record<string, any> = {};

  if (updates.userId !== undefined) updateData.user_id = updates.userId;
  if (updates.customerName !== undefined) updateData.customer_name = updates.customerName;
  if (updates.customerEmail !== undefined) updateData.customer_email = updates.customerEmail;
  if (updates.customerPhone !== undefined) updateData.customer_phone = updates.customerPhone;
  if (updates.shippingAddress !== undefined) updateData.shipping_address = updates.shippingAddress;
  if (updates.subtotal !== undefined) updateData.subtotal = updates.subtotal;
  if (updates.shippingCost !== undefined) updateData.shipping_cost = updates.shippingCost;
  if (updates.total !== undefined) updateData.total = updates.total;
  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.paymentMethod !== undefined) updateData.payment_method = updates.paymentMethod;
  if (updates.paymentStatus !== undefined) updateData.payment_status = updates.paymentStatus;
  if (updates.notes !== undefined) updateData.notes = updates.notes;

  const { error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', id);

  if (error) throw error;
}
