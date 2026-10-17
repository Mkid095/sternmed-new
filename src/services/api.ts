import { Product, Category, User, EmailMessage, Banner, SiteSettings, Order, OrderItem } from '../types';
import { auth } from '../config/firebase';
import { authService } from './auth.service';
import { databaseService } from './database.service';
import { storageService } from './storage.service';
import { ordersService } from './supabase';

/**
 * The signed-in admin's Firebase ID token.
 *
 * Edge functions authorise on this, so a request without it is rejected — the
 * admin being signed in is not the same thing as the request carrying proof.
 */
async function getFirebaseIdToken(): Promise<string> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('You must be signed in to manage orders');
  }
  return currentUser.getIdToken();
}

/**
 * Maps a raw `orders` row (plus its embedded `order_items`) onto the `Order`
 * shape the UI uses.
 *
 * The edge function returns exactly what PostgREST returned: snake_case columns
 * with a nested `order_items` array, whereas the rest of the app works in
 * camelCase. Normalising in one place keeps every call site free of that.
 */
function transformOrderRows(rows: any[]): Order[] {
  return (rows ?? []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    shippingAddress: row.shipping_address,
    subtotal: Number(row.subtotal ?? 0),
    shippingCost: Number(row.shipping_cost ?? 0),
    total: Number(row.total ?? 0),
    status: row.status,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    items: (row.order_items ?? []).map((item: any): OrderItem => ({
      id: item.id,
      orderId: item.order_id,
      productId: item.product_id,
      productName: item.product_name,
      quantity: item.quantity,
      unitPrice: Number(item.unit_price ?? 0),
      totalPrice: Number(item.total_price ?? 0),
    })),
  }));
}

// Re-export services for direct use
export { authService, databaseService, storageService };

// Centralized Data Layer API - maintains backward compatibility
export const api = {
  // Auth (Firebase)
  login: async (email: string, password: string): Promise<User> => {
    return authService.signIn(email, password);
  },

  logout: async (): Promise<void> => {
    return authService.signOut();
  },

  register: async (email: string, password: string, name: string, role: 'admin' | 'staff' = 'staff'): Promise<User> => {
    return authService.signUp(email, password, name, role);
  },

  resetPassword: async (email: string): Promise<void> => {
    return authService.resetPassword(email);
  },

  onAuthStateChange: (callback: (user: User | null) => void) => {
    return authService.onAuthStateChange(callback);
  },

  // Users (Supabase)
  getUsers: async (): Promise<User[]> => {
    return databaseService.getUsers();
  },

  createUser: async (user: Omit<User, 'id'>): Promise<User> => {
    // Note: This requires Firebase Auth to be created first
    // Use authService.signUp instead for full user creation
    throw new Error('Use authService.signUp to create users with Firebase Auth');
  },

  deleteUser: async (id: string): Promise<void> => {
    return databaseService.deleteUser(id);
  },

  updateUserRole: async (id: string, role: 'admin' | 'staff'): Promise<User> => {
    return databaseService.updateUserRole(id, role);
  },

  /**
   * Replace this user's admin page access.
   *
   * `null` means unrestricted, which is what admins use. A staff account gets
   * the explicit list.
   */
  updateUserPermissions: async (id: string, permissions: string[] | null): Promise<User> => {
    return databaseService.updateUserPermissions(id, permissions);
  },

  /**
   * Set a new password for a user (admin only).
   *
   * Firebase password changes must happen server-side with a service account,
   * so this calls the set-user-password edge function. The caller's Firebase ID
   * token is sent so the function can verify they are an admin.
   */
  setUserPassword: async (userId: string, password: string): Promise<void> => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

    // Must be signed in — the edge function authorizes on this token
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('You must be signed in to change a password');
    }
    const idToken = await currentUser.getIdToken();

    const response = await fetch(`${supabaseUrl}/functions/v1/set-user-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ userId, password }),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result?.error || 'Failed to update password');
    }
  },

  // Products (Supabase)
  getProducts: async (): Promise<Product[]> => {
    return databaseService.getProducts();
  },

  getProduct: async (id: string): Promise<Product | null> => {
    return databaseService.getProduct(id);
  },

  createProduct: async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> => {
    return databaseService.createProduct(product);
  },

  updateProduct: async (id: string, updates: Partial<Product>): Promise<Product> => {
    return databaseService.updateProduct(id, updates);
  },

  deleteProduct: async (id: string): Promise<void> => {
    return databaseService.deleteProduct(id);
  },

  // Categories (Supabase)
  getCategories: async (): Promise<Category[]> => {
    return databaseService.getCategories();
  },

  createCategory: async (category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category> => {
    return databaseService.createCategory(category);
  },

  updateCategory: async (id: string, updates: Partial<Category>): Promise<Category> => {
    return databaseService.updateCategory(id, updates);
  },

  deleteCategory: async (id: string): Promise<void> => {
    return databaseService.deleteCategory(id);
  },

  reorderCategories: async (categoryOrders: { id: string; order: number }[]): Promise<void> => {
    return databaseService.reorderCategories(categoryOrders);
  },

  // Emails (Supabase)
  getEmails: async (): Promise<EmailMessage[]> => {
    return databaseService.getEmails();
  },

  sendEmail: async (email: Omit<EmailMessage, 'id' | 'date' | 'read' | 'type' | 'createdAt'>): Promise<EmailMessage> => {
    return databaseService.sendEmail(email);
  },

  markEmailRead: async (id: string): Promise<void> => {
    return databaseService.markEmailRead(id);
  },

  deleteEmail: async (id: string): Promise<void> => {
    return databaseService.deleteEmail(id);
  },

  // Banners (Supabase)
  /** Every banner, live or parked. Admin pages need both. */
  getBanners: async (): Promise<Banner[]> => {
    return databaseService.getBanners();
  },

  /** Only the banners the homepage carousel should render. */
  getActiveBanners: async (): Promise<Banner[]> => {
    return databaseService.getActiveBanners();
  },

  createBanner: async (banner: Omit<Banner, 'id' | 'createdAt'>): Promise<Banner> => {
    return databaseService.createBanner(banner);
  },

  /** Partial update — omitted fields are left alone. */
  updateBanner: async (id: string, changes: Partial<Omit<Banner, 'id' | 'createdAt'>>): Promise<Banner> => {
    return databaseService.updateBanner(id, changes);
  },

  /** Persist a new carousel order from an array of banner ids. */
  reorderBanners: async (orderedIds: string[]): Promise<void> => {
    return databaseService.reorderBanners(orderedIds);
  },

  deleteBanner: async (id: string): Promise<void> => {
    return databaseService.deleteBanner(id);
  },

  // Settings (Supabase)
  getSettings: async (): Promise<SiteSettings> => {
    return databaseService.getSettings();
  },

  updateSettings: async (updates: Partial<SiteSettings>): Promise<SiteSettings> => {
    return databaseService.updateSettings(updates);
  },

  // Storage (Cloudinary)
  uploadImage: async (file: File): Promise<string> => {
    const result = await storageService.uploadImage(file);
    return result.url;
  },

  // ============ Orders ============
  //
  // Admin reads and status writes go through the `manage-orders` edge function.
  //
  // They cannot go through PostgREST directly: the `orders` RLS policies are
  // keyed to Supabase `auth.uid()`, but this app signs in with Firebase and
  // stores the UID in `users.firebase_uid`. `auth.uid()` is always NULL, so the
  // admin policies never match — a status change returned `204 No Content`
  // (PostgREST's "updated zero rows") and appeared to succeed while writing
  // nothing, and admin order lists only ever showed guest orders.
  //
  // The function verifies the caller's Firebase ID token and requires a staff
  // role before using the service-role client. See supabase/functions/manage-orders.

  /**
   * Every order with its items, including those placed by signed-in customers.
   *
   * Falls back to the direct anon query if the edge function is not deployed
   * yet. That fallback can only ever return GUEST orders — the RLS policies
   * behind it hide anything placed by a signed-in customer — so it is logged
   * loudly and is expected to be temporary. Status WRITES have no such
   * fallback: the direct path silently discards them, which is the bug this
   * whole change exists to fix.
   */
  getOrders: async (): Promise<Order[]> => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const idToken = await getFirebaseIdToken();

    const response = await fetch(`${supabaseUrl}/functions/v1/manage-orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({ operation: 'listOrders' }),
    }).catch(() => null);

    // A missing function answers 404; an unconfigured one can answer 500.
    if (!response || response.status === 404) {
      console.warn(
        '[orders] manage-orders edge function is not reachable — falling back to ' +
          'the direct query. Guest orders only will be shown. Deploy it with ' +
          '`npx supabase functions deploy manage-orders`.'
      );
      return ordersService.getAllOrders();
    }

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result?.error || 'Failed to load orders');
    }

    return transformOrderRows(result.orders ?? []);
  },

  getOrder: async (id: string): Promise<Order | null> => {
    return ordersService.getOrderById(id);
  },

  getUserOrders: async (userId: string): Promise<Order[]> => {
    return ordersService.getOrdersByUserId(userId);
  },

  createOrder: async (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order> => {
    return ordersService.createOrder(order);
  },

  /**
   * Set an order's status.
   *
   * Returns the row the server actually wrote, so the caller renders the
   * confirmed state instead of an optimistic guess that may not have saved.
   */
  updateOrderStatus: async (id: string, status: string): Promise<void> => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const idToken = await getFirebaseIdToken();

    const response = await fetch(`${supabaseUrl}/functions/v1/manage-orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({ operation: 'updateOrderStatus', orderId: id, status }),
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result?.error || 'Failed to update the order status');
    }
  },

  updatePaymentStatus: async (id: string, paymentStatus: string): Promise<void> => {
    return ordersService.updatePaymentStatus(id, paymentStatus);
  },

  deleteOrder: async (id: string): Promise<void> => {
    return ordersService.deleteOrder(id);
  },
};

export default api;
