// ========================================
// UpsellToast Component
// ========================================
// Custom toast for AI product suggestions
// - Glassmorphism card design
// - Product image + name + price
// - "Le Chef suggère:" header with reason
// - One-click "Ajouter" button

'use client';

import { toast } from 'sonner';
import Image from 'next/image';
import { Plus, Sparkles } from 'lucide-react';
import { useCartStore } from '@/lib/store';
import type { Product } from '@/types/schema';

/**
 * Custom Toast Component for AI Upsell
 */
function UpsellToastContent({
  product,
  reason,
  onAdd
}: {
  product: Product;
  reason: string;
  onAdd: () => void;
}) {
  return (
    <div className="w-full max-w-md bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
      {/* Header with Sparkles Icon */}
      <div className="px-4 pt-4 pb-2 border-b border-gray-200/30 dark:border-gray-700/30">
        <div className="flex items-center gap-2">
          <Sparkles
            className="w-5 h-5 text-amber-500 dark:text-amber-400"
            strokeWidth={2}
          />
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            Le Chef suggère :
          </p>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 italic">
          {reason}
        </p>
      </div>

      {/* Product Info */}
      <div className="p-4 flex items-center gap-3">
        {/* Product Image */}
        <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
          {(product.images?.[0] || product.image) ? (
            <Image
              src={product.images?.[0] || product.image || ''}
              alt={product.name}
              fill
              className="object-cover"
              sizes="80px"
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl">🍽️</span>
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-base text-gray-900 dark:text-white line-clamp-1">
            {product.name}
          </h4>
          {product.description && (
            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1 mt-0.5">
              {product.description}
            </p>
          )}
          <p className="font-bold text-sm mt-1" style={{ color: 'var(--brand-color, #FF4500)' }}>
            {product.price.toLocaleString()} FCFA
          </p>
        </div>

        {/* Add Button */}
        <button
          onClick={onAdd}
          className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-lg transition-all hover:scale-105 active:scale-95"
          style={{
            backgroundColor: 'var(--brand-color, #FF4500)',
            color: 'white',
          }}
          aria-label={`Ajouter ${product.name} au panier`}
        >
          <Plus className="w-6 h-6" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

/**
 * Show AI upsell toast
 *
 * @param product - The suggested product
 * @param reason - Short reason for the suggestion (max 8 words)
 */
export function showUpsellToast(product: Product, reason: string) {
  const { addItem } = useCartStore.getState();

  toast.custom(
    (t) => (
      <UpsellToastContent
        product={product}
        reason={reason}
        onAdd={() => {
          try {
            // Add product to cart
            addItem(product, 1);

            // Close this toast
            toast.dismiss(t);

            // Show success feedback
            toast.success(`${product.name} ajouté au panier !`, {
              duration: 2000,
            });

            console.log('[UPSELL TOAST] ✅ Product added to cart:', product.name);
          } catch (error) {
            console.error('[UPSELL TOAST] ❌ Error adding product:', error);
            toast.error('Erreur lors de l\'ajout au panier');
          }
        }}
      />
    ),
    {
      duration: 8000, // 8 seconds
      position: 'bottom-center',
      className: 'pointer-events-auto',
    }
  );
}
