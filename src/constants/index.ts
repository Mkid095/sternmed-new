/**
 * Shared Application Constants
 *
 * Central location for constant values used throughout the application.
 * This improves maintainability and prevents magic numbers in code.
 *
 * @module constants
 */

/**
 * The standalone mail application.
 *
 * Mail is not part of this admin - it is a separate app on its own host, so
 * every link out to it needs this rather than an inline literal. It was pasted
 * into seven places in AdminMails alone.
 */
export const MAIL_APP_URL = 'https://mail.sternmedafrika.com';

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
 * User role constants
 */
export const USER_ROLE = {
  ADMIN: 'admin',
  STAFF: 'staff',
  EMAIL_USER: 'email_user',
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
 * formatPrice(1234.56); // "Ksh 1234.56"
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