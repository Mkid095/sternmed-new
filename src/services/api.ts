import { Product, Category, User, EmailMessage, Banner, SiteSettings, Order } from '../types';
import { authService } from './auth.service';
import { databaseService } from './database.service';
import { storageService } from './storage.service';
import { ordersService } from './supabase';

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
  getBanners: async (): Promise<Banner[]> => {
    return databaseService.getBanners();
  },

  createBanner: async (banner: Omit<Banner, 'id' | 'createdAt'>): Promise<Banner> => {
    return databaseService.createBanner(banner);
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

  // Orders (Supabase)
  getOrders: async (): Promise<Order[]> => {
    return ordersService.getAllOrders();
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

  updateOrderStatus: async (id: string, status: string): Promise<void> => {
    return ordersService.updateOrderStatus(id, status as any);
  },

  updatePaymentStatus: async (id: string, paymentStatus: string): Promise<void> => {
    return ordersService.updatePaymentStatus(id, paymentStatus);
  },

  deleteOrder: async (id: string): Promise<void> => {
    return ordersService.deleteOrder(id);
  },
};

export default api;
