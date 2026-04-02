/**
 * Order Summary Card Component
 *
 * Displays order summary with total breakdown
 * and status update controls.
 *
 * @module OrderSummaryCard
 */

import React from 'react';
import { Order } from '../../../../types';

/**
 * Props for the OrderSummaryCard component
 */
export interface OrderSummaryCardProps {
  /** Order object containing summary data */
  order: Order;

  /** Callback when status is updated */
  onStatusUpdate: (orderId: string, status: string) => void;

  /** Optional CSS class for the card container */
  className?: string;
}

/**
 * Order summary card component
 *
 * Shows order subtotal, shipping cost, and total.
 * Includes a dropdown to update order status.
 *
 * @example
 * <OrderSummaryCard
 *   order={order}
 *   onStatusUpdate={handleStatusUpdate}
 *   className="sticky top-24"
 * />
 */
export function OrderSummaryCard({ order, onStatusUpdate, className = '' }: OrderSummaryCardProps) {
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onStatusUpdate(order.id, e.target.value);
  };

  return (
    <div className={`bg-white rounded-lg border border-slate-200 p-4 sm:p-6 sticky top-20 sm:top-24 ${className}`}>
      <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-3 sm:mb-4">
        Order Summary
      </h3>

      {/* Price Breakdown */}
      <PriceBreakdown order={order} />

      {/* Status Update */}
      <StatusUpdateSection
        currentStatus={order.status}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}

/**
 * Price breakdown section showing subtotal, shipping, and total
 */
interface PriceBreakdownProps {
  order: Order;
}

function PriceBreakdown({ order }: PriceBreakdownProps) {
  return (
    <div className="space-y-2 sm:space-y-3">
      {/* Subtotal */}
      <SummaryRow
        label="Subtotal"
        value={`Ksh ${order.subtotal.toFixed(2)}`}
      />

      {/* Shipping */}
      <SummaryRow
        label="Shipping"
        value={`Ksh ${order.shippingCost.toFixed(2)}`}
      />

      {/* Total */}
      <div className="border-t border-slate-200 pt-2 sm:pt-3 flex justify-between">
        <span className="font-bold text-slate-900">Total</span>
        <span className="text-base sm:text-lg font-bold text-slate-900">
          Ksh {order.total.toFixed(2)}
        </span>
      </div>
    </div>
  );
}

/**
 * Single row in the price breakdown
 */
interface SummaryRowProps {
  label: string;
  value: string;
}

function SummaryRow({ label, value }: SummaryRowProps) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-600">{label}</span>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  );
}

/**
 * Status update section with dropdown
 */
interface StatusUpdateSectionProps {
  currentStatus: string;
  onStatusChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

function StatusUpdateSection({ currentStatus, onStatusChange }: StatusUpdateSectionProps) {
  return (
    <div className="mt-4 sm:mt-6">
      <label htmlFor="order-status" className="block text-sm font-medium text-slate-700 mb-2">
        Update Status
      </label>
      <select
        id="order-status"
        value={currentStatus}
        onChange={onStatusChange}
        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="pending">Pending</option>
        <option value="processing">Processing</option>
        <option value="shipped">Shipped</option>
        <option value="delivered">Delivered</option>
        <option value="cancelled">Cancelled</option>
      </select>
    </div>
  );
}
