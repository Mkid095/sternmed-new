/**
 * useCheckoutForm Hook
 *
 * Custom hook for managing checkout form state and submission.
 * Handles customer data collection, order creation, and WhatsApp redirection.
 *
 * @module useCheckoutForm
 */

import React, { useState, useCallback, FormEvent } from 'react';
import { api } from '../../../services/api';
import { CartItem } from '../../../types';
import { validateCheckoutForm, sanitizeInput } from '../../../utils/validation';
import { useToastError, useToastSuccess } from '../../shared/ui';

/**
 * Checkout form data structure
 * Contains all customer information needed for order processing
 */
export interface CheckoutFormData {
  /** Customer's full name */
  name: string;

  /** Customer's email address */
  email: string;

  /** Customer's phone number */
  phone: string;

  /** Delivery/shipping address */
  address: string;

  /** Additional order notes or instructions */
  notes: string;
}

/**
 * Form validation errors
 */
export interface FormErrors {
  /** Name field error */
  name?: string;

  /** Email field error */
  email?: string;

  /** Phone field error */
  phone?: string;

  /** Address field error */
  address?: string;

  /** Notes field error */
  notes?: string;
}

/**
 * Return type for useCheckoutForm hook
 */
export interface UseCheckoutFormReturn {
  /** Current form data */
  formData: CheckoutFormData;

  /** Whether form is currently submitting */
  isSubmitting: boolean;

  /** Form validation errors */
  errors: FormErrors;

  /** Whether form has been touched (user interacted) */
  touched: {
    name: boolean;
    email: boolean;
    phone: boolean;
    address: boolean;
    notes: boolean;
  };

  /** Update form data field */
  setFormData: React.Dispatch<React.SetStateAction<CheckoutFormData>>;

  /** Handle form submission */
  handleSubmit: (e: FormEvent) => Promise<void>;

  /** Reset form to initial state */
  resetForm: () => void;

  /** Validate a specific field */
  validateField: (field: keyof CheckoutFormData, value: string) => void;
}

/**
 * Configuration options for useCheckoutForm
 */
export interface UseCheckoutFormOptions {
  /** Cart items to include in order */
  items: CartItem[];

  /** Total price for the order */
  totalPrice: number;

  /** WhatsApp number for checkout redirection */
  whatsappNumber: string;

  /** Callback when checkout completes successfully */
  onCheckoutComplete: () => void;
}

/**
 * Initial empty form state
 */
const INITIAL_FORM_DATA: CheckoutFormData = {
  name: '',
  email: '',
  phone: '',
  address: '',
  notes: '',
};

/**
 * Initial touched state
 */
const INITIAL_TOUCHED = {
  name: false,
  email: false,
  phone: false,
  address: false,
  notes: false,
};

/**
 * Generate WhatsApp message from order data
 *
 * Creates a formatted message containing:
 * - Order ID
 * - Customer details
 * - Order items with quantities and prices
 * - Order total
 * - Any additional notes
 *
 * @param orderId - Unique order identifier
 * @param formData - Customer details from form
 * @param items - Cart items
 * @param totalPrice - Order total
 * @returns Formatted WhatsApp message string
 *
 * @example
 * const message = generateWhatsAppMessage('ord-123', formData, items, 5000);
 * // Returns: "*NEW ORDER - STERNMED AFRIKA*\n\n*Order ID:* ord-123\n..."
 */
export function generateWhatsAppMessage(
  orderId: string,
  formData: CheckoutFormData,
  items: CartItem[],
  totalPrice: number
): string {
  // Format order items list
  const itemsList = items
    .map(
      (item) =>
        `• ${item.quantity}x ${item.product.name} - Ksh ${(
          item.product.price * item.quantity
        ).toFixed(2)}`
    )
    .join('\n');

  // Build message sections
  const message = `*NEW ORDER - STERNMED AFRIKA*

*Order ID:* ${orderId}

*Customer Details:*
Name: ${sanitizeInput(formData.name)}
Email: ${sanitizeInput(formData.email)}
Phone: ${sanitizeInput(formData.phone)}
Address: ${formData.address ? sanitizeInput(formData.address) : 'Not provided'}

*Order Items:*
${itemsList}

*Order Total: Ksh ${totalPrice.toFixed(2)}*

${formData.notes ? `*Notes:* ${sanitizeInput(formData.notes)}\n` : ''}Please confirm the order and provide payment details.`;

  return message;
}

/**
 * Generate WhatsApp URL with pre-filled message
 *
 * Creates a wa.me link that opens WhatsApp with the order message pre-filled.
 * Cleans the phone number by removing non-digit characters.
 *
 * @param phoneNumber - Raw phone number (may contain +, spaces, dashes)
 * @param message - Pre-filled message content
 * @returns Full WhatsApp URL
 *
 * @example
 * const url = generateWhatsAppUrl('+254 700 123 456', 'Hello');
 * // Returns: "https://wa.me/254700123456?text=Hello"
 */
export function generateWhatsAppUrl(phoneNumber: string, message: string): string {
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}

/**
 * Transform cart items to order items format
 *
 * Converts CartItem[] to the format expected by the API for order creation.
 *
 * @param items - Cart items to transform
 * @returns Array of order items with calculated totals
 *
 * @example
 * const orderItems = transformCartItemsToOrderItems(cartItems);
 */
export function transformCartItemsToOrderItems(items: CartItem[]) {
  return items.map((item) => ({
    id: '', // Will be generated by database
    orderId: '', // Will be set by API
    productId: item.product.id,
    productName: item.product.name,
    quantity: item.quantity,
    unitPrice: item.product.price,
    totalPrice: item.product.price * item.quantity,
  }));
}

/**
 * Custom hook for checkout form management
 *
 * Handles the complete checkout flow:
 * - Form state management
 * - Real-time validation
 * - Order creation via API
 * - WhatsApp message generation
 * - Error handling with user feedback
 *
 * @param options - Configuration options
 * @returns Checkout form state and handlers
 *
 * @example
 * function CheckoutPage() {
 *   const {
 *     formData,
 *     isSubmitting,
 *     errors,
 *     touched,
 *     setFormData,
 *     handleSubmit,
 *     resetForm,
 *     validateField,
 *   } = useCheckoutForm({
 *     items: cartItems,
 *     totalPrice: 5000,
 *     whatsappNumber: '+254700123456',
 *     onCheckoutComplete: () => navigate('/success'),
 *   });
 *
 *   return <form onSubmit={handleSubmit}>...</form>;
 * }
 */
export function useCheckoutForm({
  items,
  totalPrice,
  whatsappNumber,
  onCheckoutComplete,
}: UseCheckoutFormOptions): UseCheckoutFormReturn {
  // ============ State ============

  const [formData, setFormData] = useState<CheckoutFormData>(INITIAL_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState(INITIAL_TOUCHED);

  // Toast notifications
  const showError = useToastError();
  const showSuccess = useToastSuccess();

  // ============ Validation ============

  /**
   * Validate a single field
   */
  const validateField = useCallback(
    (field: keyof CheckoutFormData, value: string) => {
      let error = '';

      switch (field) {
        case 'name':
          if (!value.trim()) {
            error = 'Full name is required';
          } else if (value.trim().length < 2) {
            error = 'Name must be at least 2 characters';
          } else if (value.trim().length > 100) {
            error = 'Name must be less than 100 characters';
          }
          break;

        case 'email':
          // Email is optional - only validate if provided
          if (value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            error = 'Please enter a valid email address';
          }
          break;

        case 'phone':
          if (!value.trim()) {
            error = 'Phone number is required';
          } else {
            const cleanPhone = value.replace(/[\s\-\(\)]/g, '');
            if (!/^(\+?254|0)?[7]\d{8}$/.test(cleanPhone)) {
              error = 'Please enter a valid phone number (e.g., 0712345678)';
            }
          }
          break;

        case 'address':
          // Address is optional but must be valid if provided
          if (value && value.trim().length > 0 && value.trim().length < 5) {
            error = 'Please enter a complete address';
          } else if (value && value.trim().length > 500) {
            error = 'Address must be less than 500 characters';
          }
          break;

        case 'notes':
          // Notes are optional but must be valid if provided
          if (value && value.trim().length > 1000) {
            error = 'Notes must be less than 1000 characters';
          }
          break;
      }

      setErrors((prev) => ({ ...prev, [field]: error }));
    },
    []
  );

  /**
   * Validate all form fields
   */
  const validateAll = useCallback((): boolean => {
    const validation = validateCheckoutForm(formData);

    if (!validation.isValid) {
      // Convert array of errors to object
      const newErrors: FormErrors = {};
      validation.errors?.forEach((error) => {
        if (error.includes('name') || error.includes('Full name')) {
          newErrors.name = error;
        } else if (error.includes('email') || error.includes('Email')) {
          newErrors.email = error;
        } else if (error.includes('phone') || error.includes('Phone')) {
          newErrors.phone = error;
        } else if (error.includes('address') || error.includes('Address')) {
          newErrors.address = error;
        } else if (error.includes('notes') || error.includes('Notes')) {
          newErrors.notes = error;
        }
      });

      setErrors(newErrors);
      return false;
    }

    setErrors({});
    return true;
  }, [formData]);

  // ============ Form Handlers ============

  /**
   * Reset form to initial empty state
   */
  const resetForm = useCallback(() => {
    setFormData(INITIAL_FORM_DATA);
    setErrors({});
    setTouched(INITIAL_TOUCHED);
  }, []);

  /**
   * Handle field change with validation
   */
  const handleChange = useCallback((field: keyof CheckoutFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Validate if field has been touched
    if (touched[field]) {
      validateField(field, value);
    }
  }, [touched, validateField]);

  /**
   * Handle field blur (mark as touched and validate)
   */
  const handleBlur = useCallback((field: keyof CheckoutFormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  }, [formData, validateField]);

  /**
   * Handle form submission
   *
   * Flow:
   * 1. Validate all fields
   * 2. Check that all cart items are active products
   * 3. Create order in database via API
   * 4. Generate WhatsApp message with order details
   * 5. Open WhatsApp with pre-filled message
   * 6. Call completion callback
   */
  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();

      // Mark all fields as touched
      setTouched({
        name: true,
        email: true,
        phone: true,
        address: true,
        notes: true,
      });

      // Validate all fields
      if (!validateAll()) {
        return;
      }

      // Check that all items are active products
      const hasNonActiveProduct = items.some(item => item.product.status !== 'active');
      if (hasNonActiveProduct) {
        showError('Some items in your cart are no longer available. Please remove them and try again.');
        return;
      }

      // Bail before creating an order we can't hand off to WhatsApp
      if (!whatsappNumber.replace(/\D/g, '')) {
        showError('Checkout is temporarily unavailable. Please contact us directly.');
        return;
      }

      setIsSubmitting(true);

      try {
        // Step 1: Create order in database
        const order = await api.createOrder({
          userId: null, // Guest checkout - no user account
          customerName: formData.name.trim(),
          customerEmail: formData.email.trim(),
          customerPhone: formData.phone.replace(/[\s\-\(\)]/g, ''),
          shippingAddress: formData.address.trim(),
          subtotal: totalPrice,
          shippingCost: 0, // Calculated separately by sales team
          total: totalPrice,
          status: 'pending',
          paymentMethod: 'whatsapp',
          paymentStatus: 'pending',
          notes: formData.notes.trim(),
          items: transformCartItemsToOrderItems(items),
        });

        // Step 2: Generate WhatsApp message
        const message = generateWhatsAppMessage(order.id, formData, items, totalPrice);

        // Step 3: Generate WhatsApp URL and open
        const whatsappUrl = generateWhatsAppUrl(whatsappNumber, message);
        window.open(whatsappUrl, '_blank');

        // Step 4: Notify completion
        onCheckoutComplete();
        resetForm();
      } catch (error) {
        console.error('Checkout error:', error);

        // Provide better error messages
        let errorMessage = 'Failed to process order. Please try again.';

        if (error instanceof Error) {
          const message = error.message.toLowerCase();

          if (message.includes('network') || message.includes('fetch')) {
            errorMessage = 'Network error. Please check your connection and try again.';
          } else if (message.includes('timeout')) {
            errorMessage = 'Request timed out. Please try again.';
          }
        }

        showError(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, items, totalPrice, whatsappNumber, onCheckoutComplete, resetForm, validateAll]
  );

  return {
    formData,
    isSubmitting,
    errors,
    touched,
    setFormData,
    handleSubmit,
    resetForm,
    validateField,
  };
}
