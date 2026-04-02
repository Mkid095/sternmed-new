/**
 * Checkout Form Component
 *
 * Main checkout form for collecting customer details and processing orders.
 * Integrates with WhatsApp for order completion.
 *
 * Features:
 * - Customer information collection (name, email, phone, address)
 * - Order summary with pricing
 * - WhatsApp checkout integration
 * - Mobile responsive design
 * - Real-time validation
 * - Order creation and database persistence
 *
 * @module CheckoutForm
 */

import React, { FormEvent } from 'react';
import { AlertCircle } from 'lucide-react';
import { CartItem } from '../../../types';
import { useCheckoutForm } from '../hooks';
import { CustomerDetailsForm, OrderSummary, CheckoutButton } from './checkout';

/**
 * Props for CheckoutForm component
 */
export interface CheckoutFormProps {
  /** Items in the cart */
  items: CartItem[];

  /** Total price of all items */
  totalPrice: number;

  /** WhatsApp number for checkout (configured in settings) */
  whatsappNumber: string;

  /** Callback when checkout completes successfully */
  onCheckoutComplete: () => void;
}

/**
 * Checkout form component
 *
 * Collects customer information and processes orders via WhatsApp checkout.
 * The form creates an order in the database and redirects to WhatsApp with
 * a pre-filled message containing all order details.
 *
 * Flow:
 * 1. User fills in customer details with real-time validation
 * 2. On submit, order is created in database
 * 3. WhatsApp message is generated with order details
 * 4. User is redirected to WhatsApp to complete order
 *
 * @example
 * <CheckoutForm
 *   items={cartItems}
 *   totalPrice={calculateTotal(cartItems)}
 *   whatsappNumber={settings.phoneNumber}
 *   onCheckoutComplete={() => navigate('/success')}
 * />
 */
export function CheckoutForm({
  items,
  totalPrice,
  whatsappNumber,
  onCheckoutComplete,
}: CheckoutFormProps) {
  // ============ State Management ============

  const {
    formData,
    isSubmitting,
    errors,
    touched,
    setFormData,
    handleSubmit,
    validateField,
  } = useCheckoutForm({
    items,
    totalPrice,
    whatsappNumber,
    onCheckoutComplete,
  });

  // ============ Render ============

  return (
    <div className="w-full lg:w-96 flex-shrink-0">
      <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-6 sticky top-20 sm:top-24">
        {/* Header */}
        <h2 className="text-xl font-bold text-slate-900 mb-4 sm:mb-6">
          Customer Details
        </h2>

        {/* Form */}
        <CheckoutFormInternal
          formData={formData}
          errors={errors}
          touched={touched}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          onFormDataChange={setFormData}
          onFieldBlur={validateField}
          totalPrice={totalPrice}
        />
      </div>
    </div>
  );
}

/**
 * Internal form component (separated for cleaner code structure)
 */
interface CheckoutFormInternalProps {
  formData: {
    name: string;
    email: string;
    phone: string;
    address: string;
    notes: string;
  };
  errors: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    notes?: string;
  };
  touched: {
    name: boolean;
    email: boolean;
    phone: boolean;
    address: boolean;
    notes: boolean;
  };
  isSubmitting: boolean;
  onSubmit: (e: FormEvent) => Promise<void>;
  onFormDataChange: React.Dispatch<
    React.SetStateAction<{
      name: string;
      email: string;
      phone: string;
      address: string;
      notes: string;
    }>
  >;
  onFieldBlur: (field: 'name' | 'email' | 'phone' | 'address' | 'notes', value: string) => void;
  totalPrice: number;
}

function CheckoutFormInternal({
  formData,
  errors,
  touched,
  isSubmitting,
  onSubmit,
  onFormDataChange,
  onFieldBlur,
  totalPrice,
}: CheckoutFormInternalProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-3 sm:space-y-4">
      {/* Customer Details Input Fields */}
      <div className="space-y-3 sm:space-y-4">
        {/* Full Name */}
        <FormField
          label="Full Name *"
          required
          value={formData.name}
          error={errors.name}
          touched={touched.name}
          onChange={(value) => onFormDataChange({ ...formData, name: value })}
          onBlur={() => onFieldBlur('name', formData.name)}
          placeholder="John Doe"
          autoComplete="name"
          type="text"
        />

        {/* Email Address */}
        <FormField
          label="Email Address *"
          required
          value={formData.email}
          error={errors.email}
          touched={touched.email}
          onChange={(value) => onFormDataChange({ ...formData, email: value })}
          onBlur={() => onFieldBlur('email', formData.email)}
          placeholder="john@example.com"
          autoComplete="email"
          type="email"
        />

        {/* Phone Number */}
        <FormField
          label="Phone Number *"
          required
          value={formData.phone}
          error={errors.phone}
          touched={touched.phone}
          onChange={(value) => onFormDataChange({ ...formData, phone: value })}
          onBlur={() => onFieldBlur('phone', formData.phone)}
          placeholder="+254 7XX XXX XXX"
          autoComplete="tel"
          type="tel"
        />

        {/* Delivery Address */}
        <FormField
          label="Delivery Address"
          value={formData.address}
          error={errors.address}
          touched={touched.address}
          onChange={(value) => onFormDataChange({ ...formData, address: value })}
          onBlur={() => onFieldBlur('address', formData.address)}
          placeholder="Street, Building, City"
          autoComplete="shipping street-address"
          type="text"
        />

        {/* Additional Notes */}
        <div>
          <label
            htmlFor="notes"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Additional Notes
          </label>
          <textarea
            id="notes"
            rows={2}
            value={formData.notes}
            onChange={(e) => onFormDataChange({ ...formData, notes: e.target.value })}
            onBlur={() => onFieldBlur('notes', formData.notes)}
            className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none ${
              errors.notes && touched.notes
                ? 'border-red-300 bg-red-50'
                : 'border-slate-300'
            }`}
            placeholder="Any special instructions..."
          />
          {errors.notes && touched.notes && (
            <p className="mt-1 text-xs text-red-600">{errors.notes}</p>
          )}
        </div>
      </div>

      {/* Order Summary */}
      <OrderSummary totalPrice={totalPrice} />

      {/* Checkout Button */}
      <CheckoutButton isSubmitting={isSubmitting} />
    </form>
  );
}

/**
 * Form field with validation
 */
interface FormFieldProps {
  label: string;
  value: string;
  error?: string;
  touched?: boolean;
  onChange: (value: string) => void;
  onBlur: () => void;
  placeholder?: string;
  autoComplete?: string;
  type?: string;
  required?: boolean;
}

function FormField({
  label,
  value,
  error,
  touched,
  onChange,
  onBlur,
  placeholder,
  autoComplete,
  type = 'text',
  required = false,
}: FormFieldProps) {
  const hasError = error && touched;
  const showError = error && touched;

  return (
    <div>
      <label
        htmlFor={label.toLowerCase().replace(/\s/g, '-')}
        className="block text-sm font-medium text-slate-700 mb-1"
      >
        {label}
      </label>
      <input
        id={label.toLowerCase().replace(/\s/g, '-')}
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
          hasError
            ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500'
            : 'border-slate-300'
        }`}
      />
      {showError && (
        <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
          <AlertCircle size={12} />
          {error}
        </p>
      )}
    </div>
  );
}
