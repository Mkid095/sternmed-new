/**
 * Order Summary Component
 *
 * Displays order total breakdown including subtotal, shipping,
 * and final total for checkout confirmation.
 *
 * @module OrderSummary
 */

import { formatKsh } from '../CheckoutForm';

/**
 * Props for OrderSummary component
 */
export interface OrderSummaryProps {
  /** Subtotal price of all items */
  totalPrice: number;
}

/**
 * Order summary component
 *
 * Shows:
 * - Subtotal (sum of all items)
 * - Shipping note (calculated on WhatsApp)
 * - Final total
 *
 * @example
 * <OrderSummary totalPrice={5000} />
 */
export function OrderSummary({ totalPrice }: OrderSummaryProps) {
  return (
    <div className="border-t border-slate-200 pt-3 sm:pt-4 space-y-2">
      {/* Subtotal */}
      <div className="flex justify-between text-sm text-slate-600">
        <span>Subtotal</span>
        <span>Ksh {formatKsh(totalPrice)}</span>
      </div>

      {/* Shipping Note */}
      <div className="flex justify-between text-sm text-slate-600">
        <span>Shipping</span>
        <span>Calculated on WhatsApp</span>
      </div>

      {/* Total */}
      <div className="flex justify-between items-center pt-2 border-t border-slate-200">
        <span className="font-bold text-slate-900">Total</span>
        <span className="text-xl font-bold text-slate-900">
          Ksh {formatKsh(totalPrice)}
        </span>
      </div>
    </div>
  );
}
