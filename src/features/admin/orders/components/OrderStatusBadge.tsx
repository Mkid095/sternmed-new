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
