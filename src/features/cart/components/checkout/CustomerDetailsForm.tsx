/**
 * Customer Details Form Section
 *
 * Form section for collecting customer information during checkout.
 * Includes name, email, phone, address, and notes fields.
 *
 * @module CustomerDetailsForm
 */

import { Input } from '../../../shared/ui';

/**
 * Props for CustomerDetailsForm component
 */
export interface CustomerDetailsFormProps {
  /** Current form data values */
  formData: {
    name: string;
    email: string;
    phone: string;
    address: string;
    notes: string;
  };

  /** Callback to update form data */
  onChange: (data: {
    name: string;
    email: string;
    phone: string;
    address: string;
    notes: string;
  }) => void;
}

/**
 * Customer details form component
 *
 * Renders input fields for:
 * - Full name (required)
 * - Email address (required)
 * - Phone number (required)
 * - Delivery address (optional)
 * - Additional notes (optional)
 *
 * @example
 * <CustomerDetailsForm
 *   formData={formData}
 *   onChange={(data) => setFormData(data)}
 * />
 */
export function CustomerDetailsForm({
  formData,
  onChange,
}: CustomerDetailsFormProps) {
  /**
   * Update a single field in form data
   */
  const updateField = (field: keyof typeof formData, value: string) => {
    onChange({ ...formData, [field]: value });
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Full Name */}
      <Input
        label="Full Name *"
        required
        value={formData.name}
        onChange={(e) => updateField('name', e.target.value)}
        placeholder="John Doe"
        autoComplete="name"
      />

      {/* Email Address */}
      <Input
        label="Email Address (optional)"
        type="email"
        value={formData.email}
        onChange={(e) => updateField('email', e.target.value)}
        placeholder="john@example.com"
        autoComplete="email"
      />

      {/* Phone Number */}
      <Input
        label="Phone Number *"
        type="tel"
        required
        value={formData.phone}
        onChange={(e) => updateField('phone', e.target.value)}
        placeholder="+254 7XX XXX XXX"
        autoComplete="tel"
      />

      {/* Delivery Address */}
      <Input
        label="Delivery Address"
        value={formData.address}
        onChange={(e) => updateField('address', e.target.value)}
        placeholder="Street, Building, City"
        autoComplete="shipping street-address"
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
          onChange={(e) => updateField('notes', e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
          placeholder="Any special instructions..."
        />
      </div>
    </div>
  );
}
