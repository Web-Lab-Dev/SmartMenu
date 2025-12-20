'use client';

import { useState, useEffect, useRef } from 'react';
import {
  getDb,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  type Unsubscribe,
} from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/constants';
import type { Product, Category } from '@/types/schema';

/**
 * Grouped menu data by category
 */
export interface CategoryWithItems {
  id: string;
  name: string;
  order: number;
  icon?: string;
  items: Product[];
}

export interface MenuData {
  loading: boolean;
  data: CategoryWithItems[];
  error: Error | null;
}

/**
 * Hook to fetch and organize menu data (categories + available products)
 *
 * Features:
 * - Real-time listeners for categories and products
 * - Automatic filtering of unavailable products (isAvailable === true)
 * - Groups products by category
 * - Removes empty categories (no active products)
 * - Auto-cleanup on unmount
 *
 * @param restaurantId - Restaurant ID to fetch menu for
 * @returns MenuData with loading state, organized data, and error
 *
 * @example
 * ```tsx
 * const { loading, data, error } = useMenuData(restaurantId);
 *
 * if (loading) return <Spinner />;
 * if (error) return <Error />;
 *
 * return data.map(category => (
 *   <section key={category.id}>
 *     <h2>{category.name}</h2>
 *     <MenuGrid items={category.items} />
 *   </section>
 * ));
 * ```
 */
export function useMenuData(restaurantId: string): MenuData {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<Error | null>(null);

  // ⚡ PERF: Debounce state updates to batch changes
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingCategoriesRef = useRef<Category[] | null>(null);
  const pendingProductsRef = useRef<Product[] | null>(null);

  // Dual real-time listeners
  useEffect(() => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }

    // console.log('[useMenuData] 🔄 Setting up real-time listeners for:', restaurantId);

    let categoriesUnsubscribe: Unsubscribe | null = null;
    let productsUnsubscribe: Unsubscribe | null = null;
    let mounted = true;

    // ⚡ PERF: Batch setState calls with debounce
    const flushPendingUpdates = () => {
      if (!mounted) return;

      if (pendingCategoriesRef.current !== null) {
        setCategories(pendingCategoriesRef.current);
        pendingCategoriesRef.current = null;
      }
      if (pendingProductsRef.current !== null) {
        setProducts(pendingProductsRef.current);
        pendingProductsRef.current = null;
      }

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };

    const scheduleUpdate = () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(flushPendingUpdates, 300);
    };

    const setupListeners = async () => {
      try {
        const db = getDb();

        // Listener A: Categories (ordered by 'order' field)
        const categoriesRef = collection(db, COLLECTIONS.CATEGORIES);
        const categoriesQuery = query(
          categoriesRef,
          where('restaurantId', '==', restaurantId),
          orderBy('order', 'asc')
        );

        categoriesUnsubscribe = onSnapshot(
          categoriesQuery,
          (snapshot) => {
            if (!mounted) return;

            const cats = snapshot.docs.map((doc) => {
              const data = doc.data();
              return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate() || new Date(),
              } as Category;
            });

            // console.log('[useMenuData] 📂 Categories updated:', cats.length);
            // ⚡ PERF: Debounce update instead of immediate setState
            pendingCategoriesRef.current = cats;
            scheduleUpdate();
          },
          (err) => {
            console.error('[useMenuData] ❌ Categories listener error:', err);
            if (mounted) setError(err as Error);
          }
        );

        // Listener B: Products (ONLY isAvailable === true)
        const productsRef = collection(db, COLLECTIONS.PRODUCTS);
        const productsQuery = query(
          productsRef,
          where('restaurantId', '==', restaurantId),
          where('isAvailable', '==', true),
          orderBy('order', 'asc')
        );

        productsUnsubscribe = onSnapshot(
          productsQuery,
          (snapshot) => {
            if (!mounted) return;

            const prods = snapshot.docs.map((doc) => {
              const data = doc.data();

              // Ensure all required fields are present with defaults
              const product: Product = {
                id: doc.id,
                restaurantId: data.restaurantId || '',
                categoryId: data.categoryId || '',
                name: data.name || 'Produit sans nom',
                description: data.description || '',
                price: data.price || 0,
                isAvailable: data.isAvailable !== false, // Default true
                aiTags: data.aiTags || [],
                order: data.order || 0,
                createdAt: data.createdAt?.toDate() || new Date(),
                updatedAt: data.updatedAt?.toDate() || new Date(),
                // Optional fields
                image: data.image,
                images: data.images,
                allergens: data.allergens,
                options: data.options,
                preparationTime: data.preparationTime,
              };

              return product;
            });

            // console.log('[useMenuData] 🍽️  Products updated:', prods.length, '(available only)');
            // ⚡ PERF: Debounce update instead of immediate setState
            pendingProductsRef.current = prods;
            scheduleUpdate();
          },
          (err) => {
            console.error('[useMenuData] ❌ Products listener error:', err);
            if (mounted) setError(err as Error);
          }
        );

        // Both listeners are set up
        if (mounted) setLoading(false);
      } catch (err) {
        console.error('[useMenuData] ❌ Setup error:', err);
        if (mounted) {
          setError(err as Error);
          setLoading(false);
        }
      }
    };

    setupListeners();

    // Cleanup function
    return () => {
      mounted = false;

      // Clear any pending debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }

      if (categoriesUnsubscribe) {
        // console.log('[useMenuData] 🧹 Cleaning up categories listener');
        categoriesUnsubscribe();
      }
      if (productsUnsubscribe) {
        // console.log('[useMenuData] 🧹 Cleaning up products listener');
        productsUnsubscribe();
      }
    };
  }, [restaurantId]);

  // Data shaping: Group products by category
  const data: CategoryWithItems[] = categories
    .map((category) => {
      // Get all products for this category
      const items = products.filter((product) => product.categoryId === category.id);

      return {
        id: category.id,
        name: category.name,
        order: category.order,
        icon: category.icon,
        items,
      };
    });
    // Note: We now show ALL categories, even empty ones
    // This allows newly created categories to appear immediately

  return {
    loading,
    data,
    error,
  };
}
