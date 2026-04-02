import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CartItem, Product } from '../types';

interface CartState {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
  initialize: () => void;
}

// Storage key for localStorage
const CART_STORAGE_KEY = 'sternmed-cart';

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      initialize: () => {
        // Cart is automatically loaded from localStorage by persist middleware
        // This hook can be used for additional initialization logic
      },

      addItem: (product, quantity = 1) => set((state) => {
        // Prevent adding non-active products to cart
        if (product.status !== 'active') {
          console.warn(`Cannot add product "${product.name}" to cart: product is not active (status: ${product.status})`);
          return state;
        }

        const existingItem = state.items.find((item) => item.product.id === product.id);
        if (existingItem) {
          return {
            items: state.items.map((item) =>
              item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
            ),
          };
        }
        return { items: [...state.items, { product, quantity }] };
      }),

      removeItem: (productId) => set((state) => ({
        items: state.items.filter((item) => item.product.id !== productId),
      })),

      updateQuantity: (productId, quantity) => set((state) => ({
        items: state.items.map((item) =>
          item.product.id === productId ? { ...item, quantity: Math.max(1, quantity) } : item
        ),
      })),

      clearCart: () => set({ items: [] }),

      totalItems: () => get().items.reduce((total, item) => total + item.quantity, 0),

      totalPrice: () => get().items.reduce((total, item) => total + item.product.price * item.quantity, 0),
    }),
    {
      name: CART_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      // Partial persist - only store necessary data
      partialize: (state) => ({ items: state.items }),
    }
  )
);
