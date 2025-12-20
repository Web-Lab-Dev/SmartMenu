// ========================================
// CompactCard Component
// ========================================
// Horizontal compact card for list products (after first 2)

'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Plus } from 'lucide-react';
import type { Product } from '@/types/schema';

interface CompactCardProps {
  product: Product;
  onClick: () => void;
  onAddToCart: (e: React.MouseEvent) => void;
  // Promo pricing (optional)
  discountedPrice?: number;
  originalPrice?: number;
  promoBadge?: string;
}

// ⚡ PERF: Externaliser les variants Framer Motion
const cardVariants = {
  tap: { scale: 0.98 },
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
};

const buttonVariants = {
  tap: { scale: 0.9 },
  hover: { scale: 1.05 },
};

const cardTransition = { duration: 0.2 };

/**
 * CompactCard - Compact horizontal card for product list
 * - Square image (80px) on left
 * - Title + Description (1 line) + Price
 * - Simple "Add" button on right
 * - Memoized for performance
 */
function CompactCardComponent({
  product,
  onClick,
  onAddToCart,
  discountedPrice,
  originalPrice,
  promoBadge
}: CompactCardProps) {
  const displayPrice = discountedPrice ?? product.price;
  const hasDiscount = !!discountedPrice && !!originalPrice;

  return (
    <motion.div
      className="relative rounded-xl overflow-hidden shadow-sm border cursor-pointer group transition-all duration-300"
      style={{ backgroundColor: '#1E1E1E', borderColor: 'rgba(255, 255, 255, 0.05)' }}
      onClick={onClick}
      whileTap={cardVariants.tap}
      initial={cardVariants.initial}
      animate={cardVariants.animate}
      transition={cardTransition}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(var(--brand-rgb), 0.3)')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)')}
    >
      <div className="flex items-center gap-3 p-3">
        {/* Square Image */}
        <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0" style={{ backgroundColor: '#121212' }}>
          {(product.images?.[0] || product.image) ? (
            <Image
              src={product.images?.[0] || product.image || ''}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-300"
              sizes="80px"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl">🍽️</span>
            </div>
          )}
          {/* Promo Badge (small, top-right) */}
          {promoBadge && hasDiscount && (
            <div
              className="absolute top-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-bold shadow-md"
              style={{
                background: 'linear-gradient(135deg, #FF7D29 0%, #FF5722 100%)',
                color: '#000000',
              }}
            >
              🔥
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="font-display font-semibold text-base text-white uppercase tracking-wide mb-1 line-clamp-1">
            {product.name}
          </h4>

          {product.description && (
            <p className="text-xs text-gray-400 line-clamp-1 mb-2">
              {product.description}
            </p>
          )}

          <div className="flex items-center gap-2">
            {/* Original price (strikethrough) */}
            {hasDiscount && (
              <div className="text-xs text-gray-500 line-through">
                {originalPrice.toLocaleString()} F
              </div>
            )}
            {/* Display price */}
            <div
              className={`font-bold ${hasDiscount ? 'text-base' : 'text-sm'}`}
              style={{ color: hasDiscount ? '#FF7D29' : 'var(--brand-color)' }}
            >
              {displayPrice.toLocaleString()} FCFA
            </div>
          </div>
        </div>

        {/* Add Button */}
        <motion.button
          onClick={onAddToCart}
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-md"
          style={{
            backgroundColor: 'var(--brand-color)',
            color: '#000000',
          }}
          whileTap={buttonVariants.tap}
          whileHover={buttonVariants.hover}
          aria-label={`Ajouter ${product.name} au panier`}
        >
          <Plus className="w-5 h-5" />
        </motion.button>
      </div>
    </motion.div>
  );
}

// ⚡ PERF: Export memoized version
export const CompactCard = memo(CompactCardComponent);

/**
 * CompactCard Skeleton - Loading state
 */
export function CompactCardSkeleton() {
  return (
    <div className="relative rounded-xl overflow-hidden shadow-sm border animate-pulse" style={{ backgroundColor: '#1E1E1E', borderColor: 'rgba(255, 255, 255, 0.05)' }}>
      <div className="flex items-center gap-3 p-3">
        {/* Image Skeleton */}
        <div className="w-20 h-20 rounded-lg shrink-0" style={{ backgroundColor: '#121212' }} />

        {/* Content Skeleton */}
        <div className="flex-1 space-y-2">
          <div className="h-5 rounded w-2/3" style={{ backgroundColor: '#121212' }} />
          <div className="h-3 rounded w-full" style={{ backgroundColor: '#121212' }} />
          <div className="h-4 rounded w-1/3" style={{ backgroundColor: '#121212' }} />
        </div>

        {/* Button Skeleton */}
        <div className="w-10 h-10 rounded-full shrink-0" style={{ backgroundColor: '#121212' }} />
      </div>
    </div>
  );
}
