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
function CompactCardComponent({ product, onClick, onAddToCart }: CompactCardProps) {
  return (
    <motion.div
      className="relative bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-200/50 dark:border-gray-700/50 cursor-pointer group"
      onClick={onClick}
      whileTap={cardVariants.tap}
      initial={cardVariants.initial}
      animate={cardVariants.animate}
      transition={cardTransition}
    >
      <div className="flex items-center gap-3 p-3">
        {/* Square Image */}
        <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900 shrink-0">
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
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-base text-gray-900 dark:text-white mb-1 line-clamp-1">
            {product.name}
          </h4>

          {product.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mb-2">
              {product.description}
            </p>
          )}

          <div
            className="font-bold text-sm"
            style={{ color: 'var(--brand-color)' }}
          >
            {product.price.toLocaleString()} FCFA
          </div>
        </div>

        {/* Add Button */}
        <motion.button
          onClick={onAddToCart}
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-md"
          style={{
            backgroundColor: 'var(--brand-color)',
            color: 'white',
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
    <div className="relative bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-200/50 dark:border-gray-700/50 animate-pulse">
      <div className="flex items-center gap-3 p-3">
        {/* Image Skeleton */}
        <div className="w-20 h-20 rounded-lg bg-gray-200 dark:bg-gray-700 shrink-0" />

        {/* Content Skeleton */}
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
        </div>

        {/* Button Skeleton */}
        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
      </div>
    </div>
  );
}
