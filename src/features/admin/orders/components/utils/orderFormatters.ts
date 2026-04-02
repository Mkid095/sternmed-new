/**
 * Order Formatting Utilities
 *
 * Utility functions for formatting order-related data
 * including dates, phone numbers, and WhatsApp links.
 *
 * @module orderFormatters
 */

import { Order, OrderStatus } from '../../../../../types';

/**
 * Color classes for order status badges
 *
 * Maps each order status to its corresponding Tailwind CSS color classes.
 */
export const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

/**
 * Formats a date string into a localized date/time string
 *
 * @param dateString - ISO date string to format
 * @returns Formatted date/time or '-' if no date provided
 *
 * @example
 * formatDate('2024-01-15T10:30:00Z'); // "15 Jan 2024, 10:30"
 */
export function formatDate(dateString?: string): string {
  if (!dateString) return '-';

  return new Date(dateString).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formats a date string into a localized date only (no time)
 *
 * @param dateString - ISO date string to format
 * @returns Formatted date or '-' if no date provided
 *
 * @example
 * formatDateOnly('2024-01-15T10:30:00Z'); // "15 Jan 2024"
 */
export function formatDateOnly(dateString?: string): string {
  if (!dateString) return '-';

  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Formats payment method for display
 * Converts snake_case to readable format
 *
 * @param paymentMethod - Payment method string
 * @returns Formatted payment method
 *
 * @example
 * formatPaymentMethod('bank_transfer'); // "Bank transfer"
 */
export function formatPaymentMethod(paymentMethod: string): string {
  return paymentMethod.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Formats a phone number for use in WhatsApp links
 * Removes all non-digit characters
 *
 * @param phone - Phone number string
 * @returns Phone number with only digits, or null if no phone
 *
 * @example
 * formatPhoneForWhatsApp('+254 700 000 000'); // "254700000000"
 */
export function formatPhoneForWhatsApp(phone?: string): string | null {
  if (!phone) return null;
  return phone.replace(/\D/g, '');
}

/**
 * Generates a WhatsApp link with a pre-filled message
 *
 * @param phone - Phone number to contact
 * @param message - Message to pre-fill
 * @returns WhatsApp URL or null if no phone
 *
 * @example
 * const link = generateWhatsAppLink('+254700000000', 'Hello');
 * // Returns: "https://wa.me/254700000000?text=Hello"
 */
export function generateWhatsAppLink(phone?: string, message: string = ''): string | null {
  const cleanPhone = formatPhoneForWhatsApp(phone);
  if (!cleanPhone) return null;

  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}

/**
 * Generates a default greeting message for WhatsApp
 * Based on order information
 *
 * @param order - Order object containing customer info
 * @returns Pre-filled WhatsApp message
 */
export function generateWhatsAppGreeting(order: Pick<Order, 'id' | 'customerName'>): string {
  return `Hello ${order.customerName}, regarding your order ${order.id.slice(0, 8)}...`;
}

/**
 * Generates a tel: link for phone calls
 *
 * @param phone - Phone number
 * @returns tel: link or '#' if no phone
 *
 * @example
 * generateTelLink('+254700000000'); // "tel:+254700000000"
 */
export function generateTelLink(phone?: string): string {
  if (!phone) return '#';
  return `tel:${phone}`;
}

/**
 * Generates a mailto: link for email
 *
 * @param email - Email address
 * @returns mailto: link
 *
 * @example
 * generateMailtoLink('test@example.com'); // "mailto:test@example.com"
 */
export function generateMailtoLink(email: string): string {
  return `mailto:${email}`;
}

/**
 * Shortens an ID string for display
 *
 * @param id - Full ID string
 * @param chars - Number of characters to show
 * @returns Shortened ID with ellipsis
 *
 * @example
 * shortenId('abc123def456', 8); // "abc123de..."
 */
export function shortenId(id: string, chars: number = 8): string {
  return `${id.slice(0, chars)}...`;
}
