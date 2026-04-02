/**
 * Cart List Component
 *
 * Renders the list of items in the shopping cart.
 * Displays items in a vertical list with proper spacing.
 *
 * @module CartList
 */

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
    <div className="flex-1 space-y-3 sm:space-y-4">
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
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
    </div>
  );
}
