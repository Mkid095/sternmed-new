/**
 * Cart List Component
 *
 * Renders the list of items in the shopping cart.
 * Displays items in a vertical list with proper spacing.
 *
 * @module CartList
 */

import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Truck, MessageCircle } from 'lucide-react';
import { CartItem as CartItemType } from '../../../types';
import { CartItem } from './CartItem';

/**
 * Props for CartList component
 */
export interface CartListProps {
  /** Array of cart items to display */
  items: CartItemType[];

  /** Callback when item quantity changes */
  onQuantityChange: (productId: string, quantity: number) => void;

  /** Callback when item is removed from cart */
  onRemove: (productId: string) => void;
}

/**
 * Cart list component
 *
 * Displays all items in the cart within a styled container.
 * Each item is rendered as a CartItem component with full
 * interaction capabilities.
 *
 * @example
 * <CartList
 *   items={cartItems}
 *   onQuantityChange={(id, qty) => updateQuantity(id, qty)}
 *   onRemove={(id) => removeFromCart(id)}
 * />
 */
export function CartList({
  items,
  onQuantityChange,
  onRemove,
}: CartListProps) {
  return (
    <div className="flex-1 space-y-4">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <ul className="divide-y divide-slate-200">
          {items.map((item) => (
            <CartItem
              key={item.product.id}
              item={item}
              onQuantityChange={onQuantityChange}
              onRemove={onRemove}
            />
          ))}
        </ul>
      </div>

      {/*
        Nowhere to go but forward. A cart with no "continue shopping" link
        strands anyone who was not ready to check out — which on a catalogue
        where most items are enquiry-only is most people.
      */}
      <Link
        to="/shop"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-primary-600"
      >
        <ArrowLeft size={15} aria-hidden="true" />
        Continue shopping
      </Link>

      {/*
        The items column is much shorter than the checkout column beside it, so
        on a laptop a small cart left half the page blank. These answer the
        questions a buyer has at exactly this moment — before paying — and fill
        the column with something worth reading rather than padding.
      */}
      <ul className="grid gap-3 sm:grid-cols-3">
        <Reassurance
          icon={<MessageCircle size={16} aria-hidden="true" />}
          title="Confirm on WhatsApp"
          body="Checkout opens WhatsApp with your order. Our team confirms stock, delivery and payment before anything is charged."
        />
        <Reassurance
          icon={<ShieldCheck size={16} aria-hidden="true" />}
          title="Quality guaranteed"
          body="Products supplied as described. Faulty or incorrect items are replaced or refunded."
        />
        <Reassurance
          icon={<Truck size={16} aria-hidden="true" />}
          title="Delivery across Kenya"
          body="Nairobi next day. Elsewhere in Kenya and export are quoted with your order."
        />
      </ul>
    </div>
  );
}

function Reassurance({
  icon,
  title,
  body,
}: {
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <li className="rounded-xl border border-slate-200 bg-white p-4">
      <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
        <span className="text-primary-600">{icon}</span>
        {title}
      </span>
      <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{body}</p>
    </li>
  );
}
