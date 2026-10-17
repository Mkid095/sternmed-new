/**
 * Order Detail Component
 *
 * Displays complete order information including:
 * - Order details (ID, date, payment info)
 * - Customer information with contact options
 * - Order items list
 * - Order summary with status update
 *
 * @module OrderDetail
 */

import React from 'react';
import { Order } from '../../../../types';
import { ArrowLeft } from 'lucide-react';
import { OrderStatusBadge } from './OrderStatusBadge';
import { CustomerInfoCard } from './CustomerInfoCard';
import { OrderSummaryCard } from './OrderSummaryCard';
import { formatDate, shortenId, formatPaymentMethod } from './utils/orderFormatters';

/**
 * Props for the OrderDetail component
 */
export interface OrderDetailProps {
  /** Order object to display */
  order: Order;

  /** Callback to close the detail view */
  onClose: () => void;

  /** Callback when order status is updated */
  onStatusUpdate: (orderId: string, status: string) => void;
}

/**
 * Order detail view component
 *
 * Comprehensive view of a single order including all details,
 * customer information, items, and management controls.
 *
 * @example
 * <OrderDetail
 *   order={selectedOrder}
 *   onClose={() => setSelectedOrder(null)}
 *   onStatusUpdate={handleStatusUpdate}
 * />
 */
export function OrderDetail({ order, onClose, onStatusUpdate }: OrderDetailProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Back Button */}
      <BackButton onClick={onClose} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Column - Order Details and Customer Info */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <OrderBasicInfoCard order={order} />
          <CustomerInfoCard order={order} />
          <OrderItemsCard order={order} />
        </div>

        {/* Right Column - Summary and Status Update */}
        <div className="space-y-4 sm:space-y-6">
          <OrderSummaryCard
            order={order}
            onStatusUpdate={onStatusUpdate}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Back button to return to orders list
 */
interface BackButtonProps {
  onClick: () => void;
}

function BackButton({ onClick }: BackButtonProps) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors text-sm"
    >
      <ArrowLeft size={16} className="sm:w-4 sm:h-4" /> Back to Orders
    </button>
  );
}

/**
 * Card displaying basic order information
 */
interface OrderBasicInfoCardProps {
  order: Order;
}

function OrderBasicInfoCard({ order }: OrderBasicInfoCardProps) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-6">
      <CardHeader order={order} />

      <InfoGrid order={order} />
    </div>
  );
}

/**
 * Card header with title, ID, and status badge
 */
function CardHeader({ order }: { order: Order }) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-4">
      <div>
        <h3 className="text-base sm:text-lg font-bold text-slate-900">Order Details</h3>
        <p className="text-xs sm:text-sm text-slate-500 font-mono">{order.id}</p>
      </div>
      <OrderStatusBadge status={order.status} size="sm" className="w-fit" />
    </div>
  );
}

/**
 * Grid of order information (date, payment, etc.)
 */
interface InfoGridProps {
  order: Order;
}

function InfoGrid({ order }: InfoGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
      {/* Order Date */}
      <InfoItem label="Order Date:">
        {formatDate(order.createdAt)}
      </InfoItem>

      {/* Payment Method */}
      <InfoItem label="Payment Method:">
        {formatPaymentMethod(order.paymentMethod)}
      </InfoItem>

      {/* Payment Status */}
      <InfoItem label="Payment Status:">
        <PaymentStatusBadge status={order.paymentStatus} />
      </InfoItem>
    </div>
  );
}

/**
 * Single information item
 */
interface InfoItemProps {
  label: string;
  children: React.ReactNode;
}

function InfoItem({ label, children }: InfoItemProps) {
  return (
    <div>
      <span className="text-slate-500">{label}</span>
      <p className="font-medium text-slate-900">{children}</p>
    </div>
  );
}

/**
 * Payment status badge component
 */
interface PaymentStatusBadgeProps {
  status: string;
}

function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  const colors: Record<string, string> = {
    paid: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
    refunded: 'bg-slate-100 text-slate-800',
  };

  const colorClass = colors[status] || colors.pending;

  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${colorClass}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

/**
 * Card displaying order items
 */
interface OrderItemsCardProps {
  order: Order;
}

function OrderItemsCard({ order }: OrderItemsCardProps) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-6">
      <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-3 sm:mb-4">
        Order Items
      </h3>

      <div className="space-y-3">
        {order.items?.map((item) => {
          const row = <OrderItemRow item={item} />;
          return <React.Fragment key={item.id}>{row}</React.Fragment>;
        })}

        {/* Customer Notes */}
        {order.notes && (
          <OrderNotes notes={order.notes} />
        )}
      </div>
    </div>
  );
}

/**
 * Single order item row
 */
interface OrderItemRowProps {
  item: {
    id: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  };
}

function OrderItemRow({ item }: OrderItemRowProps) {
  return (
    <div className="flex items-center gap-3 sm:gap-4 p-3 bg-slate-50 rounded-md">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-900 truncate">{item.productName}</p>
        <p className="text-xs sm:text-sm text-slate-500">
          {item.quantity} x Ksh {item.unitPrice.toFixed(2)}
        </p>
      </div>
      <p className="text-sm sm:text-base font-bold text-slate-900 flex-shrink-0">
        Ksh {item.totalPrice.toFixed(2)}
      </p>
    </div>
  );
}

/**
 * Customer notes display
 */
interface OrderNotesProps {
  notes: string;
}

function OrderNotes({ notes }: OrderNotesProps) {
  return (
    <div className="mt-4 p-3 bg-blue-50 rounded-md">
      <p className="text-xs sm:text-sm text-slate-600">
        <span className="font-medium">Note:</span> {notes}
      </p>
    </div>
  );
}
