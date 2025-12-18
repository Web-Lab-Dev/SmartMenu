'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import type { Product } from '@/types/schema';
import { formatCurrency, getPrimaryProductImage } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  onClick: () => void;
}

/**
 * Product card with Shared Layout Animation
 * - Image uses layoutId for magic motion transition
 * - Tap feedback animation
 * - Glassmorphism style
 * - Optimized with React.memo
 */
function ProductCardComponent({ product, onClick }: ProductCardProps) {
  return (
    <motion.button
      onClick={onClick}
      className="glass-panel rounded-2xl overflow-hidden text-left w-full touch-feedback transition-glass"
      whileTap={{ scale: 0.98 }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      {/* Product Image */}
      <motion.div
        layoutId={`product-image-${product.id}`}
        className="relative w-full aspect-square bg-gray-100 dark:bg-gray-800"
      >
        {(() => {
          const imageUrl = getPrimaryProductImage(product);
          return imageUrl ? (
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 33vw"
              priority={false}
              loading="lazy"
              placeholder="blur"
              blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2VlZSIvPjwvc3ZnPg=="
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <span className="text-4xl">🍽️</span>
            </div>
          );
        })()}

        {/* Smart Tags (AI Recommended, Best Seller, etc.) */}
        {product.aiTags && product.aiTags.length > 0 && (
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.aiTags.includes('ai-recommended') && (
              <span className="glass-panel px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-500/90 to-pink-500/90 text-white flex items-center gap-1">
                🤖 Recommandé
              </span>
            )}
            {product.aiTags.includes('best-seller') && (
              <span className="glass-panel px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-orange-500/90 to-red-500/90 text-white flex items-center gap-1">
                🔥 Best Seller
              </span>
            )}
            {product.aiTags.includes('spicy') && (
              <span className="glass-panel px-2 py-1 rounded-full text-xs font-medium bg-red-500/90 text-white">
                🌶️ Épicé
              </span>
            )}
            {product.aiTags.includes('vegan') && (
              <span className="glass-panel px-2 py-1 rounded-full text-xs font-medium bg-green-500/90 text-white">
                🥗 Vegan
              </span>
            )}
          </div>
        )}

        {/* Availability Badge */}
        {!product.isAvailable && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="glass-panel px-3 py-1 rounded-full text-sm font-medium text-white">
              Indisponible
            </span>
          </div>
        )}
      </motion.div>

      {/* Product Info */}
      <div className="p-4 space-y-2">
        <motion.h3
          layoutId={`product-title-${product.id}`}
          className="font-semibold text-gray-900 dark:text-white line-clamp-2"
        >
          {product.name}
        </motion.h3>

        {product.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {product.description}
          </p>
        )}

        {/* Price & Prep Time */}
        <div className="flex items-center justify-between pt-2">
          <motion.p
            layoutId={`product-price-${product.id}`}
            className="text-lg font-bold"
            style={{ color: 'var(--brand-color)' }}
          >
            {formatCurrency(product.price)}
          </motion.p>

          {product.preparationTime && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              ~{product.preparationTime}min
            </span>
          )}
        </div>

        {/* Allergens Tags */}
        {product.allergens && product.allergens.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {product.allergens.slice(0, 3).map((allergen) => (
              <span
                key={allergen}
                className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
              >
                {allergen}
              </span>
            ))}
            {product.allergens.length > 3 && (
              <span className="text-xs text-gray-500">+{product.allergens.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </motion.button>
  );
}

// Export memoized version for performance
export const ProductCard = memo(ProductCardComponent);
