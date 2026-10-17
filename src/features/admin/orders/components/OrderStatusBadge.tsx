/**
 * Order Status Badge Component
 *
 * Displays order status as a colored badge/pill
 *
 * @module OrderStatusBadge
 */

import { OrderStatus } from '../../../../types';
import { getStatusTone } from '../../../../theme/adminTheme';

/**
 * Props for the OrderStatusBadge component
 */
export interface OrderStatusBadgeProps {
  /** The order status to display */
  status: OrderStatus;

  /** Additional CSS classes for styling */
  className?: string;

  /** Size variant for the badge */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Order status badge component
 *
 * Displays the order status as a colored badge.
 * Colors correspond to the status type (pending, shipped, etc.)
 *
 * @example
 * <OrderStatusBadge status="pending" />
 * <OrderStatusBadge status="delivered" size="lg" />
 */
export function OrderStatusBadge({
  status,
  className = '',
  size = 'sm',
}: OrderStatusBadgeProps) {
  // Size classes mapping
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-2.5 py-1.5',
    lg: 'text-base px-3 py-2',
  };

  const tone = getStatusTone(status);

  return (
    <span
      className={[
        'inline-flex items-center font-semibold rounded-full',
        tone.bg,
        tone.fg,
        sizeClasses[size],
        className,
      ].join(' ')}
      role="status"
      aria-label={`Order status: ${status}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}


/**
 * Payment status badge.
 *
 * A sibling of OrderStatusBadge rather than a variant of it: payment has its
 * own vocabulary (paid / failed / refunded) that does not overlap the order
 * statuses, and mapping one onto the other to borrow the colours would make the
 * tone mean two different things.
 *
 * @module OrderStatusBadge
 */
export interface PaymentStatusBadgeProps {
  status: string;
  className?: string;
}

const PAYMENT_TONE: Record<string, { bg: string; fg: string }> = {
  paid: { bg: 'bg-emerald-100', fg: 'text-emerald-800' },
  pending: { bg: 'bg-amber-100', fg: 'text-amber-800' },
  failed: { bg: 'bg-red-100', fg: 'text-red-800' },
  refunded: { bg: 'bg-slate-100', fg: 'text-slate-700' },
};

export function PaymentStatusBadge({ status, className = '' }: PaymentStatusBadgeProps) {
  // An unrecognised status falls back to neutral rather than silently reading
  // as paid.
  const tone = PAYMENT_TONE[status] ?? { bg: 'bg-slate-100', fg: 'text-slate-700' };

  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold capitalize',
        tone.bg,
        tone.fg,
        className,
      ].join(' ')}
      role="status"
      aria-label={`Payment status: ${status}`}
    >
      {status}
    </span>
  );
}
