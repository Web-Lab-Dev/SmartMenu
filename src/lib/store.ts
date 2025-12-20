// ========================================
// Global State Management (Zustand)
// ========================================

import { create } from 'zustand';
import { persist, PersistOptions } from 'zustand/middleware';
import type { Product, OrderItem } from '@/types/schema';
import { calculateOrderTotal, areOptionsEqual } from './utils';
import { APP_CONFIG, ERROR_MESSAGES } from './constants';

// ========================================
// Cart Store (For customer menu)
// ========================================

export interface CartItem extends OrderItem {
  product: Product; // Full product data for UI
  // Promo tracking (optional)
  originalPrice?: number; // Price before promo discount
  wasDiscounted?: boolean; // True if item was added during active promo
}

interface AppliedCoupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed_amount' | 'free_item';
  discountValue: number;
  discountDescription: string;
}

interface CartStore {
  items: CartItem[];
  restaurantId: string | null;
  tableId: string | null;
  appliedCoupon: AppliedCoupon | null;

  // Actions
  addItem: (product: Product, quantity?: number, options?: OrderItem['options']) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: (force?: boolean) => void;
  setContext: (restaurantId: string, tableId: string) => void;
  applyCoupon: (coupon: AppliedCoupon) => void;
  removeCoupon: () => void;

  // Computed
  getTotalItems: () => number;
  getSubtotal: () => number;
  getDiscountAmount: () => number;
  getTotalAmount: () => number;
}

/**
 * Cart storage schema with versioning
 */
interface CartStorageV1 {
  version: 1;
  items: CartItem[];
  restaurantId: string | null;
  tableId: string | null;
  appliedCoupon: AppliedCoupon | null;
  timestamp: number;
}

const CART_MAX_AGE_MS = APP_CONFIG.SESSION_TIMEOUT_MS;

/**
 * Persist configuration with versioning and migration
 */
const persistOptions: PersistOptions<CartStore, Partial<CartStorageV1>> = {
  name: APP_CONFIG.CART_STORAGE_KEY,
  version: APP_CONFIG.CART_VERSION,

  // Custom serialization with timestamp
  partialize: (state): CartStorageV1 => ({
    version: APP_CONFIG.CART_VERSION,
    items: state.items,
    restaurantId: state.restaurantId,
    tableId: state.tableId,
    appliedCoupon: state.appliedCoupon,
    timestamp: Date.now(),
  }),

  // Handle migrations and expiration
  migrate: (persistedState: unknown, version: number) => {
    // Type guard for persisted state
    if (
      !persistedState ||
      typeof persistedState !== 'object' ||
      !('timestamp' in persistedState)
    ) {
      console.log('Invalid persisted cart state, resetting...');
      return {
        items: [],
        restaurantId: null,
        tableId: null,
        appliedCoupon: null,
      };
    }

    const state = persistedState as CartStorageV1;

    // Check if cart is expired
    if (Date.now() - state.timestamp > CART_MAX_AGE_MS) {
      console.log('Cart expired, clearing...');
      return {
        items: [],
        restaurantId: null,
        tableId: null,
        appliedCoupon: null,
      };
    }

    // Handle version migrations
    if (version < APP_CONFIG.CART_VERSION) {
      console.log(`Migrating cart from v${version} to v${APP_CONFIG.CART_VERSION}`);
      // Add migration logic here when needed
    }

    return state;
  },

  // Error handling for rehydration
  onRehydrateStorage: () => {
    return (state, error) => {
      if (error) {
        console.error('Failed to rehydrate cart:', error);
        // Clear corrupted data
        try {
          localStorage.removeItem(APP_CONFIG.CART_STORAGE_KEY);
        } catch {
          // Ignore if localStorage is not available
        }
      } else if (state) {
        // console.log('✓ Cart rehydrated successfully');
      }
    };
  },
};

/**
 * Cart store with persistence and validation
 */
export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      restaurantId: null,
      tableId: null,
      appliedCoupon: null,

      /**
       * Add item to cart with validation
       * - Validates context (restaurant/table)
       * - Validates max items limit
       * - Validates same restaurant
       * - Deduplicates items with same product+options
       */
      addItem: (product, quantity = 1, options) => {
        const state = get();

        // Validate context is set
        if (!state.restaurantId || !state.tableId) {
          throw new Error(ERROR_MESSAGES.CART_NO_CONTEXT);
        }

        // Validate product belongs to the same restaurant
        if (product.restaurantId !== state.restaurantId) {
          throw new Error(ERROR_MESSAGES.CART_DIFFERENT_RESTAURANT);
        }

        // Validate quantity is positive
        if (quantity <= 0) {
          throw new Error('Quantity must be positive');
        }

        // Validate max items limit
        const currentTotal = state.getTotalItems();
        if (currentTotal + quantity > APP_CONFIG.MAX_CART_ITEMS) {
          throw new Error(ERROR_MESSAGES.CART_MAX_ITEMS(APP_CONFIG.MAX_CART_ITEMS));
        }

        const items = state.items;

        /**
         * Cart deduplication strategy:
         * We consider an item as "duplicate" if it has:
         * 1. Same productId
         * 2. Same options (same customizations)
         *
         * If duplicate found: increment quantity
         * If not found: add as new cart item
         */
        const existingIndex = items.findIndex(
          (item) =>
            item.productId === product.id && areOptionsEqual(item.options, options)
        );

        if (existingIndex >= 0) {
          // Item already exists, increment quantity
          const existingItem = items[existingIndex];
          if (!existingItem) {
            throw new Error('Cart item not found');
          }
          const newQuantity = existingItem.quantity + quantity;

          // Validate max quantity per item
          if (newQuantity > APP_CONFIG.MAX_ORDER_QUANTITY) {
            throw new Error(
              ERROR_MESSAGES.CART_MAX_QUANTITY(APP_CONFIG.MAX_ORDER_QUANTITY)
            );
          }

          const newItems = [...items];
          const itemToUpdate = newItems[existingIndex];
          if (itemToUpdate) {
            itemToUpdate.quantity = newQuantity;
          }
          set({ items: newItems });
        } else {
          // New item configuration, add to cart
          const newItem: CartItem = {
            productId: product.id,
            productName: product.name,
            quantity,
            unitPrice: product.price,
            options: options || undefined,
            product,
          };
          set({ items: [...items, newItem] });
        }
      },

      /**
       * Remove item from cart
       */
      removeItem: (productId) => {
        set({ items: get().items.filter((item) => item.productId !== productId) });
      },

      /**
       * Update item quantity with validation
       */
      updateQuantity: (productId, quantity) => {
        // If quantity is 0 or negative, remove item
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }

        // Validate max quantity
        if (quantity > APP_CONFIG.MAX_ORDER_QUANTITY) {
          throw new Error(
            ERROR_MESSAGES.CART_MAX_QUANTITY(APP_CONFIG.MAX_ORDER_QUANTITY)
          );
        }

        const newItems = get().items.map((item) =>
          item.productId === productId ? { ...item, quantity } : item
        );
        set({ items: newItems });
      },

      /**
       * Clear cart with optional force flag
       * Preserves restaurantId and tableId context to allow multiple orders
       */
      clearCart: (force = false) => {
        const state = get();

        if (!force && state.items.length > 0) {
          console.warn('Clearing cart with items. Set force=true to suppress warning.');
        }

        // Only clear items and coupon, preserve restaurant/table context
        set({ items: [], appliedCoupon: null });
      },

      /**
       * Set restaurant and table context
       * Clears cart if context changes
       */
      setContext: (restaurantId, tableId) => {
        const state = get();

        // If context changes, clear cart and coupon
        if (
          state.restaurantId &&
          state.restaurantId !== restaurantId &&
          state.items.length > 0
        ) {
          console.warn('Restaurant context changed, clearing cart...');
          set({ items: [], restaurantId, tableId, appliedCoupon: null });
        } else {
          set({ restaurantId, tableId });
        }
      },

      /**
       * Apply a coupon to the cart
       */
      applyCoupon: (coupon) => {
        set({ appliedCoupon: coupon });
      },

      /**
       * Remove applied coupon
       */
      removeCoupon: () => {
        set({ appliedCoupon: null });
      },

      /**
       * Get total number of items in cart
       */
      getTotalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      /**
       * Get subtotal before discount (in cents)
       */
      getSubtotal: () => {
        return calculateOrderTotal(get().items);
      },

      /**
       * Calculate discount amount based on applied coupon (in cents)
       */
      getDiscountAmount: () => {
        const state = get();
        if (!state.appliedCoupon) return 0;

        const subtotal = state.getSubtotal();
        const { discountType, discountValue } = state.appliedCoupon;

        switch (discountType) {
          case 'percentage':
            // Percentage discount (e.g., 15% off)
            return Math.round((subtotal * discountValue) / 100);

          case 'fixed_amount':
            // Fixed amount discount (e.g., 500 cents = 5€ off)
            // Don't discount more than the subtotal
            return Math.min(discountValue, subtotal);

          case 'free_item':
            // Free item - for now, return 0 (would need product price lookup)
            // This can be implemented later if needed
            return 0;

          default:
            return 0;
        }
      },

      /**
       * Get final total amount after discount (in cents)
       */
      getTotalAmount: () => {
        const subtotal = get().getSubtotal();
        const discount = get().getDiscountAmount();
        return Math.max(0, subtotal - discount);
      },
    }),
    persistOptions
  )
);

// ========================================
// Auth Store (For admin dashboard)
// ========================================

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  restaurantId: string | null;
  restaurantName?: string | null;
}

interface AuthStore {
  user: User | null;
  loading: boolean;

  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

/**
 * Auth store for managing user authentication state
 * PERF: Initialize with loading=false to prevent blocking the entire app
 */
export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: false, // Start false for better perceived performance

  setUser: (user) => set({ user, loading: false }),
  setLoading: (loading) => set({ loading }),
  logout: () => set({ user: null }),
}));

// ========================================
// Admin Dashboard Store (For real-time orders)
// ========================================

interface AdminStore {
  selectedOrderId: string | null;
  filterStatus: string | null;

  setSelectedOrder: (orderId: string | null) => void;
  setFilterStatus: (status: string | null) => void;
  clearFilters: () => void;
}

/**
 * Admin store for dashboard state management
 */
export const useAdminStore = create<AdminStore>((set) => ({
  selectedOrderId: null,
  filterStatus: null,

  setSelectedOrder: (orderId) => set({ selectedOrderId: orderId }),
  setFilterStatus: (status) => set({ filterStatus: status }),
  clearFilters: () => set({ selectedOrderId: null, filterStatus: null }),
}));

// ========================================
// Menu Cache Store (Performance Optimization)
// ========================================

interface CachedData<T> {
  data: T;
  timestamp: number;
}

interface MenuCacheStore {
  // Restaurant data cache (using plain objects instead of Map for Zustand compatibility)
  restaurants: Record<string, CachedData<any>>;
  products: Record<string, CachedData<Product[]>>;
  categories: Record<string, CachedData<any[]>>;

  // Cache management
  setRestaurant: (id: string, data: any) => void;
  getRestaurant: (id: string) => any | null;
  setProducts: (restaurantId: string, data: Product[]) => void;
  getProducts: (restaurantId: string) => Product[] | null;
  setCategories: (restaurantId: string, data: any[]) => void;
  getCategories: (restaurantId: string) => any[] | null;
  clearCache: () => void;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

/**
 * Menu cache store - Prevents redundant Firebase calls
 * CRITICAL FOR PERFORMANCE: Reduces menu load time from 10s to <1s
 */
export const useMenuCache = create<MenuCacheStore>((set, get) => ({
  restaurants: {},
  products: {},
  categories: {},

  setRestaurant: (id, data) => {
    set((state) => ({
      restaurants: {
        ...state.restaurants,
        [id]: { data, timestamp: Date.now() },
      },
    }));
  },

  getRestaurant: (id) => {
    const cached = get().restaurants[id];
    if (!cached) return null;
    if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
      // Cache expired - remove it
      set((state) => {
        const { [id]: removed, ...rest } = state.restaurants;
        return { restaurants: rest };
      });
      return null;
    }
    return cached.data;
  },

  setProducts: (restaurantId, data) => {
    set((state) => ({
      products: {
        ...state.products,
        [restaurantId]: { data, timestamp: Date.now() },
      },
    }));
  },

  getProducts: (restaurantId) => {
    const cached = get().products[restaurantId];
    if (!cached) return null;
    if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
      set((state) => {
        const { [restaurantId]: removed, ...rest } = state.products;
        return { products: rest };
      });
      return null;
    }
    return cached.data;
  },

  setCategories: (restaurantId, data) => {
    set((state) => ({
      categories: {
        ...state.categories,
        [restaurantId]: { data, timestamp: Date.now() },
      },
    }));
  },

  getCategories: (restaurantId) => {
    const cached = get().categories[restaurantId];
    if (!cached) return null;
    if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
      set((state) => {
        const { [restaurantId]: removed, ...rest } = state.categories;
        return { categories: rest };
      });
      return null;
    }
    return cached.data;
  },

  clearCache: () => {
    set({
      restaurants: {},
      products: {},
      categories: {},
    });
  },
}));
