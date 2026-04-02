/**
 * Shared Application Constants
 *
 * Central location for all constant values used throughout the application.
 * This improves maintainability and prevents magic numbers in code.
 *
 * @module constants
 */

/**
 * Order status constants
 */
export const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;

/**
 * Order status type for TypeScript
 */
export type OrderStatusType = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];

/**
 * Order status display labels
 */
export const ORDER_STATUS_LABELS: Record<OrderStatusType, string> = {
  pending: 'Pending',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

/**
 * Order status color classes for UI badges
 */
export const ORDER_STATUS_COLORS: Record<OrderStatusType, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

/**
 * Payment status constants
 */
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

/**
 * Payment status type for TypeScript
 */
export type PaymentStatusType = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS];

/**
 * Payment status display labels
 */
export const PAYMENT_STATUS_LABELS: Record<PaymentStatusType, string> = {
  pending: 'Pending',
  paid: 'Paid',
  failed: 'Failed',
  refunded: 'Refunded',
};

/**
 * Payment status color classes for UI badges
 */
export const PAYMENT_STATUS_COLORS: Record<PaymentStatusType, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-slate-100 text-slate-800',
};

/**
 * User role constants
 */
export const USER_ROLE = {
  ADMIN: 'admin',
  STAFF: 'staff',
  EMAIL_USER: 'email_user',
} as const;

/**
 * User role type for TypeScript
 */
export type UserRoleType = typeof USER_ROLE[keyof typeof USER_ROLE];

/**
 * Image validation constants
 */
export const IMAGE_VALIDATION = {
  /** Maximum file size in bytes (5MB) */
  MAX_FILE_SIZE: 5 * 1024 * 1024,

  /** Accepted image MIME types */
  ACCEPTED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],

  /** Accepted image types for file input accept attribute */
  ACCEPTED_TYPES_STRING: 'image/jpeg,image/jpg,image/png,image/webp,image/gif',

  /** Banner image dimensions */
  BANNER_WIDTH: 1900,
  BANNER_HEIGHT: 500,
  BANNER_ASPECT_RATIO: '3.8/1' as const,

  /** Product image recommended dimensions */
  PRODUCT_WIDTH: 400,
  PRODUCT_HEIGHT: 300,
} as const;

/**
 * Pagination constants
 */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
} as const;

/**
 * Currency formatting
 */
export const CURRENCY = {
  CODE: 'Ksh',
  SYMBOL: 'Ksh',
  LOCALE: 'en-KE',
  DECIMAL_PLACES: 2,
} as const;

/**
 * Format price in Kenyan Shillings
 *
 * @param amount - The amount to format
 * @returns Formatted price string
 *
 * @example
 * formatPrice(1234.56); // "Ksh 1,234.56"
 */
export function formatPrice(amount: number): string {
  return `${CURRENCY.SYMBOL} ${amount.toFixed(CURRENCY.DECIMAL_PLACES)}`;
}

/**
 * Date/time formatting constants
 */
export const DATETIME = {
  /** Date format for display */
  DISPLAY_FORMAT: 'en-GB',

  /** Date format for form inputs */
  INPUT_FORMAT: 'yyyy-MM-dd',

  /** Date/time format for display */
  DATETIME_FORMAT: 'dd MMM yyyy, HH:mm',
} as const;

/**
 * Low stock threshold for products
 */
export const INVENTORY = {
  /** Stock level below which low stock warning is shown */
  LOW_STOCK_THRESHOLD: 20,

  /** Stock level below which out of stock warning is shown */
  OUT_OF_STOCK_THRESHOLD: 0,
} as const;

/**
 * WhatsApp configuration
 */
export const WHATSAPP = {
  /** Default WhatsApp number (should be overridden by settings) */
  DEFAULT_NUMBER: '254700000000',

  /** Base WhatsApp URL */
  BASE_URL: 'https://wa.me/',
} as const;

/**
 * Generate WhatsApp link with pre-filled message
 *
 * @param phone - Phone number (digits only)
 * @param message - Pre-filled message
 * @returns WhatsApp URL
 *
 * @example
 * const link = generateWhatsAppLink('254700000000', 'Hello');
 * // Returns: "https://wa.me/254700000000?text=Hello"
 */
export function generateWhatsAppLink(phone: string, message: string): string {
  const encodedMessage = encodeURIComponent(message);
  return `${WHATSAPP.BASE_URL}${phone}?text=${encodedMessage}`;
}

/**
 * Filter options for admin tables
 */
export const TABLE_FILTERS = {
  /** Default number of rows to show */
  DEFAULT_PAGE_SIZE: 10,

  /** Available page size options */
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
} as const;

/**
 * Admin navigation menu items
 */
export const ADMIN_NAV_ITEMS = [
  { path: '/admin', label: 'Dashboard', icon: 'LayoutDashboard' },
  { path: '/admin/products', label: 'Products', icon: 'Package' },
  { path: '/admin/categories', label: 'Categories', icon: 'LayoutList' },
  { path: '/admin/orders', label: 'Orders', icon: 'ShoppingCart' },
  { path: '/admin/landing-config', label: 'Landing Config', icon: 'LayoutTemplate' },
  { path: '/admin/banners', label: 'Banners', icon: 'ImageIcon' },
  { path: '/admin/emails', label: 'Email Platform', icon: 'Mail' },
  { path: '/admin/email-aliases', label: 'Email Aliases', icon: 'Mail', adminOnly: true },
  { path: '/admin/email-unassigned', label: 'Unassigned Emails', icon: 'AlertCircle', adminOnly: true },
  { path: '/admin/email-templates', label: 'Email Templates', icon: 'FileText', adminOnly: true },
  { path: '/admin/users', label: 'Users & Roles', icon: 'Users', adminOnly: true },
  { path: '/admin/settings', label: 'Settings', icon: 'Settings' },
] as const;

/**
 * Email status constants
 */
export const EMAIL_STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  FAILED: 'failed',
} as const;

/**
 * Email outbound status type
 */
export type EmailOutboundStatusType = typeof EMAIL_STATUS[keyof typeof EMAIL_STATUS];

/**
 * Email status display labels
 */
export const EMAIL_STATUS_LABELS: Record<EmailOutboundStatusType, string> = {
  pending: 'Pending',
  sent: 'Sent',
  failed: 'Failed',
};

/**
 * Email status color classes for UI badges
 */
export const EMAIL_STATUS_COLORS: Record<EmailOutboundStatusType, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  sent: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
};

/**
 * Email platform navigation items for email users
 */
export const EMAIL_PLATFORM_NAV_ITEMS = [
  { path: '/email/inbox', label: 'Inbox', icon: 'Inbox' },
  { path: '/email/sent', label: 'Sent', icon: 'Send' },
  { path: '/email/compose', label: 'Compose', icon: 'PenSquare' },
  { path: '/email/settings', label: 'Settings', icon: 'Settings' },
] as const;

/**
 * Email pagination settings
 */
export const EMAIL_PAGINATION = {
  INBOX_PAGE_SIZE: 20,
  SENT_PAGE_SIZE: 20,
  UNASSIGNED_PAGE_SIZE: 50,
} as const;

/**
 * Email rate limit defaults
 */
export const EMAIL_RATE_LIMITS = {
  DAILY_LIMIT: 100,
  MONTHLY_LIMIT: 3000,
} as const;

/**
 * Email attachment validation
 */
export const EMAIL_ATTACHMENT = {
  /** Maximum attachment size in bytes (10MB) */
  MAX_FILE_SIZE: 10 * 1024 * 1024,

  /** Accepted MIME types */
  ACCEPTED_TYPES: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
  ],

  /** Signed URL expiry in seconds (1 hour) */
  SIGNED_URL_EXPIRY: 3600,
} as const;

/**
 * API endpoint paths
 */
export const API_PATHS = {
  // Products
  PRODUCTS: '/products',
  PRODUCT_BY_ID: (id: string) => `/products/${id}`,

  // Categories
  CATEGORIES: '/categories',
  CATEGORY_BY_ID: (id: string) => `/categories/${id}`,

  // Orders
  ORDERS: '/orders',
  ORDER_BY_ID: (id: string) => `/orders/${id}`,
  ORDER_ITEMS: (id: string) => `/orders/${id}/items`,

  // Users
  USERS: '/users',
  USER_BY_ID: (id: string) => `/users/${id}`,

  // Banners
  BANNERS: '/banners',
  BANNER_BY_ID: (id: string) => `/banners/${id}`,

  // Settings
  SETTINGS: '/settings',

  // Emails (legacy)
  EMAILS: '/emails',
  EMAIL_BY_ID: (id: string) => `/emails/${id}`,

  // Email aliases
  EMAIL_ALIASES: '/email-aliases',
  EMAIL_ALIAS_BY_ID: (id: string) => `/email-aliases/${id}`,

  // Email inbound
  EMAIL_INBOUND: '/email-inbound',
  EMAIL_INBOUND_BY_ID: (id: string) => `/email-inbound/${id}`,

  // Email outbound
  EMAIL_OUTBOUND: '/email-outbound',
  EMAIL_OUTBOUND_BY_ID: (id: string) => `/email-outbound/${id}`,

  // Email templates
  EMAIL_TEMPLATES: '/email-templates',
  EMAIL_TEMPLATE_BY_ID: (id: string) => `/email-templates/${id}`,

  // Email unassigned
  EMAIL_UNASSIGNED: '/email-unassigned',
  EMAIL_UNASSIGNED_BY_ID: (id: string) => `/email-unassigned/${id}`,
} as const;
