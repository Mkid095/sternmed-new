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
      <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 bg-slate-100 rounded-md overflow-hidden">
        <img
          src={item.product.imageUrl}
          alt={item.product.name}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Product Details */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        {/* Product Name, Price, Stock Warning */}
        <div className="mb-2 sm:mb-0">
          <h3 className="text-sm sm:text-base font-medium text-slate-900 line-clamp-2">
            {item.product.name}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Ksh {item.product.price.toFixed(2)} each
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
          />

          {/* Total Price */}
          <div className="text-right min-w-[70px] sm:min-w-[80px]">
            <span className="text-base sm:text-lg font-bold text-slate-900">
              Ksh {(item.product.price * item.quantity).toFixed(2)}
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
}

function QuantitySelector({
  quantity,
  onDecrease,
  onIncrease,
  canDecrease,
}: QuantitySelectorProps) {
  return (
    <div className="flex items-center border border-slate-300 rounded-md overflow-hidden">
      <button
        onClick={onDecrease}
        className="p-1.5 sm:p-2 text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={!canDecrease}
        aria-label="Decrease quantity"
      >
        <Minus size={14} className="sm:w-4 sm:h-4" />
      </button>
      <span className="w-8 sm:w-10 text-center text-sm font-medium text-slate-900">
        {quantity}
      </span>
      <button
        onClick={onIncrease}
        className="p-1.5 sm:p-2 text-slate-600 hover:bg-slate-100 transition-colors"
        aria-label="Increase quantity"
      >
        <Plus size={14} className="sm:w-4 sm:h-4" />
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
      className="p-1.5 sm:p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors"
      aria-label="Remove item"
    >
      <Trash2 size={16} className="sm:w-5 sm:h-5" />
    </button>
  );
}
