/**
 * Checkout Button Component
 *
 * WhatsApp checkout button with loading state and helper text.
 * Opens WhatsApp with pre-filled order message.
 *
 * @module CheckoutButton
 */

import { MessageCircle } from 'lucide-react';
import { Button } from '../../../shared/ui';

/**
 * Props for CheckoutButton component
 */
export interface CheckoutButtonProps {
  /** Whether form is currently submitting */
  isSubmitting: boolean;

  /** Optional custom button text */
  text?: string;

  /** Optional className for styling */
  className?: string;
}

/**
 * Checkout button component
 *
 * Features:
 * - WhatsApp branding with icon
 * - Loading state during submission
 * - Disabled state while processing
 * - Helper text below button
 *
 * @example
 * <CheckoutButton
 *   isSubmitting={isSubmitting}
 *   text="Complete Order"
 * />
 */
export function CheckoutButton({
  isSubmitting,
  text = 'Checkout via WhatsApp',
  className = '',
}: CheckoutButtonProps) {
  return (
    <div className="space-y-2">
      {/* Submit Button */}
      <Button
        type="submit"
        variant="success"
        className={`w-full py-2.5 sm:py-3 ${className}`}
        disabled={isSubmitting}
      >
        <MessageCircle size={18} />
        {isSubmitting ? 'Processing...' : text}
      </Button>

      {/* Helper Text */}
      <p className="text-xs text-slate-500 text-center">
        You will be redirected to WhatsApp to complete your order with our
        sales team.
      </p>
    </div>
  );
}
