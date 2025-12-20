// ========================================
// HeroCard Component
// ========================================
// Large vertical card for featured products (first 2 in each category)

'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Plus } from 'lucide-react';
import type { Product } from '@/types/schema';

interface HeroCardProps {
  product: Product;
  onClick: () => void;
  onAddToCart: (e: React.MouseEvent) => void;
  priority?: boolean; // For LCP optimization on first card
  // Promo pricing (optional)
  discountedPrice?: number;
  originalPrice?: number;
  promoBadge?: string; // "HAPPY HOUR" or "PROMO"
}

// ⚡ PERF: Externaliser les variants Framer Motion pour éviter de recréer les objets
const cardVariants = {
  tap: { scale: 0.98 },
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const buttonVariants = {
  tap: { scale: 0.9 },
  hover: { scale: 1.05 },
};

const cardTransition = { duration: 0.3 };

/**
 * HeroCard - Showcase card for featured products
 * - Large 16:9 image
 * - Title + Price + Description (2 lines)
 * - Floating "Add" button on image
 * - Memoized for performance
 */
function HeroCardComponent({
  product,
  onClick,
  onAddToCart,
  priority = false,
  discountedPrice,
  originalPrice,
  promoBadge
}: HeroCardProps) {
  const displayPrice = discountedPrice ?? product.price;
  const hasDiscount = !!discountedPrice && !!originalPrice;

  return (
    <motion.div
      className="relative rounded-2xl overflow-hidden shadow-sm border cursor-pointer group transition-all duration-300"
      style={{ backgroundColor: '#1E1E1E', borderColor: 'rgba(255, 255, 255, 0.05)' }}
      onClick={onClick}
      whileTap={cardVariants.tap}
      initial={cardVariants.initial}
      animate={cardVariants.animate}
      transition={cardTransition}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(var(--brand-rgb), 0.3)')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)')}
    >
      {/* Image Container */}
      <div className="relative aspect-[16/9] overflow-hidden" style={{ backgroundColor: '#121212' }}>
        {(product.images?.[0] || product.image) ? (
          <Image
            src={product.images?.[0] || product.image || ''}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={priority}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-6xl">🍽️</span>
          </div>
        )}

        {/* Promo Badge (top-left) */}
        {promoBadge && hasDiscount && (
          <motion.div
            initial={{ scale: 0, rotate: -12 }}
            animate={{ scale: 1, rotate: -12 }}
            className="absolute top-3 left-3 px-3 py-1.5 rounded-lg font-bold text-xs shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #FF7D29 0%, #FF5722 100%)',
              color: '#000000',
            }}
          >
            🔥 {promoBadge}
          </motion.div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

        {/* Floating Add Button */}
        <motion.button
          onClick={onAddToCart}
          className="absolute bottom-3 right-3 w-12 h-12 rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm"
          style={{
            backgroundColor: 'var(--brand-color)',
            color: '#000000',
          }}
          whileTap={buttonVariants.tap}
          whileHover={buttonVariants.hover}
          aria-label={`Ajouter ${product.name} au panier`}
        >
          <Plus className="w-6 h-6" />
        </motion.button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display font-bold text-lg text-white uppercase tracking-wide line-clamp-1 flex-1">
            {product.name}
          </h3>
          <div className="shrink-0 flex flex-col items-end">
            {/* Show original price strikethrough if on promo */}
            {hasDiscount && (
              <div className="text-xs text-gray-500 line-through">
                {originalPrice.toLocaleString()} F
              </div>
            )}
            {/* Display price */}
            <div
              className={`font-bold ${hasDiscount ? 'text-xl' : 'text-lg'}`}
              style={{ color: hasDiscount ? '#FF7D29' : 'var(--brand-color)' }}
            >
              {displayPrice.toLocaleString()} FCFA
            </div>
          </div>
        </div>

        {product.description && (
          <p className="text-sm text-gray-400 line-clamp-2">
            {product.description}
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ⚡ PERF: Export memoized version pour éviter re-renders inutiles
export const HeroCard = memo(HeroCardComponent);

/**
 * HeroCard Skeleton - Loading state
 */
export function HeroCardSkeleton() {
  return (
    <div className="relative rounded-2xl overflow-hidden shadow-sm border animate-pulse" style={{ backgroundColor: '#1E1E1E', borderColor: 'rgba(255, 255, 255, 0.05)' }}>
      {/* Image Skeleton */}
      <div className="aspect-[16/9]" style={{ backgroundColor: '#121212' }} />

      {/* Content Skeleton */}
      <div className="p-4 space-y-3">
        <div className="h-6 rounded w-3/4" style={{ backgroundColor: '#121212' }} />
        <div className="h-4 rounded w-full" style={{ backgroundColor: '#121212' }} />
        <div className="h-4 rounded w-5/6" style={{ backgroundColor: '#121212' }} />
      </div>
    </div>
  );
}
