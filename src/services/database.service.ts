// Re-export modular Supabase services for backward compatibility
export {
  productsService,
  categoriesService,
  bannersService,
  emailsService,
  usersService,
  settingsService,
} from './supabase';

// Legacy databaseService object that combines all services
import { productsService, categoriesService, bannersService, emailsService, usersService, settingsService } from './supabase';

export const databaseService = {
  // Products
  getProducts: productsService.getProducts,
  getProduct: productsService.getProduct,
  createProduct: productsService.createProduct,
  updateProduct: productsService.updateProduct,
  deleteProduct: productsService.deleteProduct,

  // Categories
  getCategories: categoriesService.getCategories,
  createCategory: categoriesService.createCategory,
  updateCategory: categoriesService.updateCategory,
  deleteCategory: categoriesService.deleteCategory,
  reorderCategories: categoriesService.reorderCategories,

  // Banners
  getBanners: bannersService.getBanners,
  getActiveBanners: bannersService.getActiveBanners,
  createBanner: bannersService.createBanner,
  updateBanner: bannersService.updateBanner,
  deleteBanner: bannersService.deleteBanner,
  reorderBanners: bannersService.reorderBanners,

  // Emails
  getEmails: emailsService.getEmails,
  sendEmail: emailsService.sendEmail,
  markEmailRead: emailsService.markEmailRead,
  deleteEmail: emailsService.deleteEmail,

  // Users
  getUsers: usersService.getUsers,
  deleteUser: usersService.deleteUser,
  updateUserRole: usersService.updateUserRole,
  updateUserPermissions: usersService.updateUserPermissions,
  createUser: usersService.createUser,

  // Settings
  getSettings: settingsService.getSettings,
  updateSettings: settingsService.updateSettings,
};

export default databaseService;
