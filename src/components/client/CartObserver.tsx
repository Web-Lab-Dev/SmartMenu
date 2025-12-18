// ========================================
// CartObserver Component
// ========================================
// Observes cart changes and triggers AI upsell suggestions
// - Uses 3-second debounce to avoid spam
// - Calls /api/ai/upsell when cart changes
// - Shows custom toast with suggested product

'use client';

import { useEffect, useRef } from 'react';
import { useCartStore } from '@/lib/store';
import { showUpsellToast } from '@/components/client/UpsellToast';
import type { Product } from '@/types/schema';

const DEBOUNCE_DELAY_MS = 3000; // 3 seconds

interface UpsellResponse {
  suggestedProductId: string;
  shortReason: string;
}

interface CartObserverProps {
  products: Product[]; // All available products for the restaurant
}

/**
 * CartObserver - Monitors cart changes and triggers AI recommendations
 *
 * Flow:
 * 1. Subscribe to cart store changes
 * 2. Debounce for 3 seconds after last change
 * 3. Call AI upsell API with cart and menu context
 * 4. Show custom toast with suggestion
 */
export function CartObserver({ products }: CartObserverProps) {
  const { items, restaurantId } = useCartStore();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastCartLengthRef = useRef(0);

  useEffect(() => {
    // Clear any existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    // Only trigger on cart additions (not removals or initial load)
    if (items.length === 0 || items.length <= lastCartLengthRef.current) {
      lastCartLengthRef.current = items.length;
      return;
    }

    // Only proceed if we have a restaurant context
    if (!restaurantId) {
      lastCartLengthRef.current = items.length;
      return;
    }

    console.log('[CART OBSERVER] 👀 Cart changed, debouncing AI suggestion...');

    // Start debounce timer
    debounceTimerRef.current = setTimeout(async () => {
      try {
        console.log('[CART OBSERVER] ⏱️  Debounce complete, triggering AI suggestion');

        // Validate we have products
        if (!products || products.length === 0) {
          console.log('[CART OBSERVER] ⚠️  No products available for AI suggestion');
          return;
        }

        // Prepare cart items for API
        const cartItems = items.map(item => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        }));

        // Prepare menu context for API
        const menuContext = products.map(product => ({
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          categoryId: product.categoryId,
          aiTags: product.aiTags || [],
        }));

        console.log('[CART OBSERVER] 📡 Calling AI upsell API...');

        // Call AI upsell API
        const response = await fetch('/api/ai/upsell', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cartItems,
            menuContext,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error('[CART OBSERVER] ❌ API error:', error);
          return;
        }

        const data: UpsellResponse = await response.json();

        // Validate response
        if (!data.suggestedProductId || !data.shortReason) {
          console.log('[CART OBSERVER] ⚠️  No suggestion returned from API');
          return;
        }

        // Find the suggested product
        const suggestedProduct = products.find(p => p.id === data.suggestedProductId);

        if (!suggestedProduct) {
          console.error('[CART OBSERVER] ❌ Suggested product not found in menu');
          return;
        }

        console.log(`[CART OBSERVER] ✅ Showing suggestion: ${suggestedProduct.name}`);

        // Show custom toast with suggestion
        showUpsellToast(suggestedProduct, data.shortReason);

      } catch (error) {
        console.error('[CART OBSERVER] ❌ Error in AI upsell flow:', error);
      }
    }, DEBOUNCE_DELAY_MS);

    // Update last cart length
    lastCartLengthRef.current = items.length;

    // Cleanup function
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [items, restaurantId, products]);

  // This component doesn't render anything
  return null;
}
