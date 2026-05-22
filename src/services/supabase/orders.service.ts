import { supabase } from '../../config/supabase';
import { Order, OrderItem, OrderStatus } from '../../types';
import { OrderRow, OrderItemRow } from './orders/types';

// Convert database row to app type
const fromOrderRow = (row: OrderRow): Order => ({
  id: row.id,
  userId: row.user_id,
  customerName: row.customer_name,
  customerEmail: row.customer_email,
  customerPhone: row.customer_phone || undefined,
  shippingAddress: row.shipping_address || undefined,
  subtotal: Number(row.subtotal),
  shippingCost: Number(row.shipping_cost),
  total: Number(row.total),
  status: row.status as OrderStatus,
  paymentMethod: row.payment_method as any,
  paymentStatus: row.payment_status as any,
  notes: row.notes || undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const fromOrderItemRow = (row: OrderItemRow): OrderItem => ({
  id: row.id,
  orderId: row.order_id,
  productId: row.product_id,
  productName: row.product_name,
  quantity: row.quantity,
  unitPrice: Number(row.unit_price),
  totalPrice: Number(row.total_price),
  createdAt: row.created_at,
});

export const ordersService = {
  // Get all orders (admin only)
  getAllOrders: async (): Promise<Order[]> => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Fetch items for each order
    const orders = await Promise.all(
      (data || []).map(async (order) => {
        const items = await ordersService.getOrderItems(order.id);
        return { ...fromOrderRow(order), items };
      })
    );

    return orders;
  },

  // Get order by ID
  getOrderById: async (id: string): Promise<Order | null> => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    const items = await ordersService.getOrderItems(id);
    return { ...fromOrderRow(data), items };
  },

  // Get orders by user ID
  getOrdersByUserId: async (userId: string): Promise<Order[]> => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Fetch items for each order
    const orders = await Promise.all(
      (data || []).map(async (order) => {
        const items = await ordersService.getOrderItems(order.id);
        return { ...fromOrderRow(order), items };
      })
    );

    return orders;
  },

  // Get order items
  getOrderItems: async (orderId: string): Promise<OrderItem[]> => {
    const { data, error } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);

    if (error) throw error;
    return (data || []).map(fromOrderItemRow);
  },

  // Create order with items
  createOrder: async (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order> => {
    // First, create the order
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: order.userId,
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
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Then, create the order items
    if (order.items && order.items.length > 0) {
      const itemsToInsert = order.items.map((item) => ({
        order_id: orderData.id,
        product_id: item.productId,
        product_name: item.productName,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.totalPrice,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;
    }

    return ordersService.getOrderById(orderData.id);
  },

  // Update order status
  updateOrderStatus: async (id: string, status: OrderStatus): Promise<void> => {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id);

    if (error) throw error;
  },

  // Update payment status
  updatePaymentStatus: async (id: string, paymentStatus: string): Promise<void> => {
    const { error } = await supabase
      .from('orders')
      .update({ payment_status: paymentStatus })
      .eq('id', id);

    if (error) throw error;
  },

  // Delete order
  deleteOrder: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Get order statistics
  getOrderStats: async (): Promise<{
    total: number;
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    totalRevenue: number;
  }> => {
    const { data, error } = await supabase
      .from('orders')
      .select('status, total, payment_status');

    if (error) throw error;

    const stats = {
      total: data?.length || 0,
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      totalRevenue: 0,
    };

    (data || []).forEach((order) => {
      // Count by status
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
      if (order.payment_status === 'paid') {
        stats.totalRevenue += Number(order.total);
      }
    });

    return stats;
  },
};

export default ordersService;
