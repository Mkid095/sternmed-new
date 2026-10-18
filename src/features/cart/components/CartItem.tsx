/**
 * Cart Item Component
 *
 * Individual item display within the shopping cart.
 * Shows product image, details, quantity controls, and actions.
 *
 * @module CartItem
 */

import { CartItem as CartItemType } from '../../../types';
import { Trash2, Plus, Minus } from 'lucide-react';
import { formatKsh } from './CheckoutForm';

/**
 * Props for CartItem component
 */
export interface CartItemProps {
  /** Unique key for list rendering (typically product ID) */
  key?: string;

  /** Cart item data including product and quantity */
  item: CartItemType;

  /** Callback when quantity is changed */
  onQuantityChange: (productId: string, quantity: number) => void;

  /** Callback when item is removed from cart */
  onRemove: (productId: string) => void;
}

/**
 * Cart item component
 *
 * Displays a single cart item with:
 * - Product thumbnail (fixed aspect ratio)
 * - Product name and price
 * - Low stock warning (if applicable)
 * - Quantity selector (+/- buttons)
 * - Item total price
 * - Remove button
 *
 * Responsive design:
 * - Mobile: Vertical layout with stacked elements
 * - Desktop: Horizontal layout with better spacing
 *
 * @example
 * <CartItem
 *   item={cartItem}
 *   onQuantityChange={(id, qty) => updateQuantity(id, qty)}
 *   onRemove={(id) => removeFromCart(id)}
 * />
 */
export function CartItem({
  item,
  onQuantityChange,
  onRemove,
}: CartItemProps) {
  return (
    <li className="p-3 sm:p-4 lg:p-6 flex flex-col sm:flex-row gap-3 sm:gap-4 lg:gap-6">
      {/* Product Image - Fixed aspect ratio (1:1) */}
      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white sm:h-24 sm:w-24">
        {item.product.imageUrl ? (
          <img
            src={item.product.imageUrl}
            alt={item.product.name}
            className="h-full w-full object-contain p-1.5"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span
            aria-hidden="true"
            className="grid h-full w-full place-items-center bg-slate-50 text-sm font-semibold text-slate-300"
          >
            {item.product.name.trim().charAt(0).toUpperCase() || '•'}
          </span>
        )}
      </div>

      {/* Product Details */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        {/* Product Name, Price, Stock Warning */}
        <div className="mb-2 sm:mb-0">
          <h3 className="text-sm sm:text-base font-medium text-slate-900 line-clamp-2">
            {item.product.name}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Ksh {formatKsh(item.product.price)} each
          </p>
          {/* Low Stock Warning */}
          {item.product.stock < 10 && (
            <p className="text-xs text-orange-600 mt-1">
              Only {item.product.stock} left in stock
            </p>
          )}
        </div>

        {/* Quantity, Price, Remove Controls */}
        <div className="flex items-center justify-between gap-2 sm:gap-4 mt-auto">
          {/* Quantity Selector */}
          <QuantitySelector
            quantity={item.quantity}
            onDecrease={() => onQuantityChange(item.product.id, item.quantity - 1)}
            onIncrease={() => onQuantityChange(item.product.id, item.quantity + 1)}
            canDecrease={item.quantity > 1}
            /*
              The stepper will happily let you add more than we hold, and the
              order then goes to the sales team already wrong. Stock is 0 for
              "coming soon" items that are not in the cart at all, so the cap
              only applies when there is a real figure to cap against.
             */
            canIncrease={item.product.stock <= 0 || item.quantity < item.product.stock}
          />

          {/* Total Price */}
          <div className="text-right min-w-[70px] sm:min-w-[80px]">
            <span className="text-base sm:text-lg font-bold text-slate-900">
              Ksh {formatKsh(item.product.price * item.quantity)}
            </span>
          </div>

          {/* Remove Button */}
          <RemoveButton onRemove={() => onRemove(item.product.id)} />
        </div>
      </div>
    </li>
  );
}

/**
 * Quantity selector component with +/- buttons
 */
interface QuantitySelectorProps {
  /** Current quantity value */
  quantity: number;

  /** Callback to decrease quantity */
  onDecrease: () => void;

  /** Callback to increase quantity */
  onIncrease: () => void;

  /** Whether decrease button should be enabled */
  canDecrease: boolean;

  /** Whether increase button should be enabled — stops at available stock */
  canIncrease: boolean;
}

function QuantitySelector({
  quantity,
  onDecrease,
  onIncrease,
  canDecrease,
  canIncrease,
}: QuantitySelectorProps) {
  return (
    <div className="flex items-center border border-slate-300 rounded-md overflow-hidden">
      <button
        onClick={onDecrease}
        className="p-1.5 text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent sm:p-2"
        disabled={!canDecrease}
        aria-label="Decrease quantity"
      >
        <Minus size={14} className="sm:w-4 sm:h-4" aria-hidden="true" />
      </button>
      <span
        aria-live="polite"
        className="w-9 text-center text-sm font-medium tabular-nums text-slate-900 sm:w-11"
      >
        {quantity}
      </span>
      <button
        onClick={onIncrease}
        disabled={!canIncrease}
        className="p-1.5 text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent sm:p-2"
        aria-label="Increase quantity"
      >
        <Plus size={14} className="sm:w-4 sm:h-4" aria-hidden="true" />
      </button>
    </div>
  );
}

/**
 * Remove button component
 */
interface RemoveButtonProps {
  /** Callback to remove item */
  onRemove: () => void;
}

function RemoveButton({ onRemove }: RemoveButtonProps) {
  return (
    <button
      onClick={onRemove}
      className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
      aria-label="Remove item from cart"
    >
      <Trash2 size={16} className="sm:w-5 sm:h-5" aria-hidden="true" />
    </button>
  );
}
