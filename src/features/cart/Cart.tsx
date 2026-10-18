/**
 * Shopping Cart Page
 *
 * Main shopping cart page for customers.
 * Displays cart items and provides checkout via WhatsApp.
 *
 * Features:
 * - View all items in cart
 * - Adjust quantities
 * - Remove items
 * - Checkout via WhatsApp with order details
 *
 * @module Cart
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { api } from '../../services/api';
import { resolveWhatsAppNumber } from '../../services/supabase/settings.service';
import { SiteSettings } from '../../types';
import { CartList } from './components/CartList';
import { CheckoutForm } from './components/CheckoutForm';

/**
 * Shopping Cart Page Component
 *
 * Displays items in the shopping cart and provides WhatsApp checkout:
 * - Empty cart state with link to shop
 * - Cart items list with quantity controls
 * - Checkout form with customer details collection
 * - WhatsApp integration for order completion
 *
 * @example
 * <Route path="/cart" element={<Cart />} />
 */
export default function Cart() {
  // ============ State Management ============

  const { items, removeItem, updateQuantity, totalPrice, clearCart } = useCartStore();
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  /** WhatsApp number to hand the order off to (admin-configurable) */
  const whatsappNumber = resolveWhatsAppNumber(settings) ?? '';

  // ============ Data Fetching ============

  /**
   * Fetch site settings for WhatsApp number
   */
  useEffect(() => {
    api.getSettings()
      .then(setSettings)
      .catch((error) => console.error('Failed to fetch settings:', error));
  }, []);

  // ============ Handlers ============

  /**
   * Handle checkout completion
   * Clears cart after successful order
   */
  const handleCheckoutComplete = () => {
    clearCart();
  };

  // ============ Empty Cart State ============

  if (items.length === 0) {
    return <EmptyCartState />;
  }

  // ============ Main Layout ============

  return (
    /*
      Extra bottom space on mobile clears the fixed pay bar, so the last thing in
      the column is never sitting underneath it.
    */
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pb-32 lg:pb-6">
      {/* Page Header */}
      <CartHeader />

      {/* Cart Content */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Cart Items List */}
        <CartList
          items={items}
          onQuantityChange={updateQuantity}
          onRemove={removeItem}
        />

        {/* Checkout Form */}
        <CheckoutForm
          items={items}
          totalPrice={totalPrice()}
          whatsappNumber={whatsappNumber}
          onCheckoutComplete={handleCheckoutComplete}
        />
      </div>
    </div>
  );
}

/**
 * Cart page header
 */
function CartHeader() {
  return (
    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6 sm:mb-8">
      Shopping Cart
    </h1>
  );
}

/**
 * Empty cart state with link to shop
 */
function EmptyCartState() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
      {/* Empty Cart Icon */}
      <div className="flex justify-center mb-6">
        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center">
          <ShoppingCart size={48} className="text-slate-400" />
        </div>
      </div>

      {/* Empty Cart Message */}
      <h2 className="text-2xl font-bold text-slate-900 mb-4">
        Your Cart is Empty
      </h2>
      <p className="text-slate-500 mb-8">
        Looks like you haven't added any items to your cart yet.
      </p>

      {/* Continue Shopping Button */}
      <Link
        to="/shop"
        className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition-colors"
      >
        <ArrowLeft size={18} />
        Continue Shopping
      </Link>
    </div>
  );
}
