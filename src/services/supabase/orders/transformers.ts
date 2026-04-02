/**
 * Orders Service - Data Transformers
 *
 * Functions to convert between database row types (snake_case)
 * and application types (camelCase) for orders.
 *
 * @module orders.transformers
 */

import { Order, OrderItem, OrderStatus } from '../../../types';
import {
  OrderRow,
  OrderItemRow,
  CreateOrderInput,
  CreateOrderItemInput,
} from './types';

/**
 * Converts a database row to an application Order type
 *
 * Transforms snake_case database columns to camelCase app properties.
 * Handles optional fields and type conversions.
 *
 * @param row - Database row from orders table
 * @returns Application Order type
 *
 * @example
 * const order = fromOrderRow(dbRow);
 * console.log(order.customerName); // camelCase property
 */
export function fromOrderRow(row: OrderRow): Order {
  return {
    id: row.id,
    userId: row.user_id,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    // Convert null to undefined for optional properties
    customerPhone: row.customer_phone || undefined,
    shippingAddress: row.shipping_address || undefined,
    // Ensure numbers are properly typed
    subtotal: Number(row.subtotal),
    shippingCost: Number(row.shipping_cost),
    total: Number(row.total),
    // Cast status to proper type
    status: row.status as OrderStatus,
    paymentMethod: row.payment_method as any,
    paymentStatus: row.payment_status as any,
    notes: row.notes || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Converts a database row to an application OrderItem type
 *
 * Transforms snake_case database columns to camelCase app properties.
 *
 * @param row - Database row from order_items table
 * @returns Application OrderItem type
 *
 * @example
 * const item = fromOrderItemRow(dbRow);
 * console.log(item.productName); // camelCase property
 */
export function fromOrderItemRow(row: OrderItemRow): OrderItem {
  return {
    id: row.id,
    orderId: row.order_id,
    productId: row.product_id,
    productName: row.product_name,
    quantity: row.quantity,
    // Ensure numbers are properly typed
    unitPrice: Number(row.unit_price),
    totalPrice: Number(row.total_price),
    createdAt: row.created_at,
  };
}

/**
 * Converts an application Order to database input format
 *
 * Transforms camelCase app properties to snake_case database columns.
 * Used when creating new orders.
 *
 * @param order - Application Order type
 * @returns Database input type for order creation
 *
 * @example
 * const input = toCreateOrderInput(appOrder);
 * await supabase.from('orders').insert(input);
 */
export function toCreateOrderInput(
  order: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'items'>
): CreateOrderInput {
  return {
    user_id: order.userId || null,
    customer_name: order.customerName,
    customer_email: order.customerEmail,
    customer_phone: order.customerPhone || null,
    shipping_address: order.shippingAddress || null,
    subtotal: order.subtotal,
    shipping_cost: order.shippingCost,
    total: order.total,
    status: order.status,
    payment_method: order.paymentMethod,
    payment_status: order.paymentStatus,
    notes: order.notes || null,
  };
}

/**
 * Converts application OrderItems to database input format
 *
 * Transforms an array of OrderItems to the format expected
 * by the order_items table for bulk insertion.
 *
 * @param orderId - The ID of the order these items belong to
 * @param items - Array of application OrderItem types
 * @returns Array of database input types for item creation
 *
 * @example
 * const items = toCreateOrderItemInputs(orderId, orderItems);
 * await supabase.from('order_items').insert(items);
 */
export function toCreateOrderItemInputs(
  orderId: string,
  items: OrderItem[]
): CreateOrderItemInput[] {
  return items.map((item) => ({
    order_id: orderId,
    product_id: item.productId,
    product_name: item.productName,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    total_price: item.totalPrice,
  }));
}

/**
 * Enriches an order with its items
 *
 * Takes an order and an array of items, combining them
 * into the final Order type expected by the application.
 *
 * @param order - Order from database (without items)
 * @param items - Array of order items
 * @returns Complete Order with items array
 *
 * @example
 * const order = await getOrderById(id);
 * const items = await getOrderItems(id);
 * const completeOrder = enrichOrderWithItems(order, items);
 */
export function enrichOrderWithItems(
  order: OrderRow,
  items: OrderItemRow[]
): Order {
  return {
    ...fromOrderRow(order),
    items: items.map(fromOrderItemRow),
  };
}
