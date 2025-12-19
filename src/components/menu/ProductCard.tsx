'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Plus } from 'lucide-react';
import type { Product } from '@/types/schema';
import { formatCurrency, getPrimaryProductImage } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  onClick: () => void;
  variant?: 'bistro-row' | 'hero';
  index?: number; // Pour les animations staggered
}

/**
 * 🔥 BISTRO ROW VARIANT
 * Layout horizontal dense, style menu restaurant moderne
 * - Texte 65% gauche, Image 35% droite
 * - Image circulaire qui "pop out"
 * - Design minimaliste et élégant
 */
function BistroRowCard({ product, onClick, index = 0 }: ProductCardProps) {
  const imageUrl = getPrimaryProductImage(product);
  const isBestSeller = product.aiTags?.includes('best-seller');
  const isRecommended = product.aiTags?.includes('ai-recommended');

  return (
    <motion.button
      onClick={onClick}
      className="
        bg-background-surface
        border border-white/5 hover:border-primary/30
        rounded-2xl overflow-visible
        text-left w-full
        touch-feedback
        transition-all duration-300
        hover:shadow-lg hover:shadow-primary/10
        group
        relative
      "
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 24,
        delay: index * 0.05, // Staggered animation
      }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center gap-4 p-4">
        {/* LEFT: Texte (65%) */}
        <div className="flex-1 space-y-2 pr-2">
          {/* Badges */}
          <div className="flex gap-2 mb-1">
            {isBestSeller && (
              <span className="
                inline-flex items-center gap-1
                bg-primary text-black
                px-2 py-0.5 rounded-full
                font-display text-[10px] uppercase font-bold
              ">
                <span>🔥</span>
                Best
              </span>
            )}
            {isRecommended && (
              <span className="
                inline-flex items-center gap-1
                bg-purple-500 text-white
                px-2 py-0.5 rounded-full
                font-display text-[10px] uppercase font-bold
              ">
                <span>🤖</span>
                IA
              </span>
            )}
          </div>

          {/* Nom du plat */}
          <motion.h3
            layoutId={`product-title-${product.id}`}
            className="
              font-display text-lg text-text-primary
              uppercase tracking-wide
              line-clamp-1
              group-hover:text-primary transition-colors
            "
          >
            {product.name}
          </motion.h3>

          {/* Description */}
          {product.description && (
            <p className="
              text-text-secondary text-xs
              line-clamp-2 italic
              leading-relaxed
            ">
              {product.description}
            </p>
          )}

          {/* Prix et temps */}
          <div className="flex items-center gap-3 pt-1">
            <motion.p
              layoutId={`product-price-${product.id}`}
              className="font-display text-xl font-bold text-primary"
            >
              {formatCurrency(product.price)}
            </motion.p>

            {product.preparationTime && (
              <span className="text-xs text-text-muted">
                ~{product.preparationTime}min
              </span>
            )}
          </div>

          {/* Allergènes */}
          {product.allergens && product.allergens.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {product.allergens.slice(0, 2).map((allergen) => (
                <span
                  key={allergen}
                  className="
                    text-[10px] px-1.5 py-0.5 rounded
                    bg-orange-500/10 text-orange-300
                    border border-orange-500/20
                  "
                >
                  {allergen}
                </span>
              ))}
              {product.allergens.length > 2 && (
                <span className="text-xs text-text-muted">
                  +{product.allergens.length - 2}
                </span>
              )}
            </div>
          )}
        </div>

        {/* RIGHT: Image circulaire (35%) */}
        <div className="relative shrink-0">
          <motion.div
            layoutId={`product-image-${product.id}`}
            className="
              relative w-28 h-28
              rounded-full overflow-hidden
              border-4 border-background-surface
              shadow-xl
              group-hover:border-primary/30
              transition-all duration-300
              group-hover:scale-110
              -mr-2
            "
            style={{
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
            }}
          >
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={product.name}
                fill
                className="object-cover"
                sizes="112px"
                priority={false}
                loading="lazy"
              />
            ) : (
              <div className="
                flex items-center justify-center h-full
                bg-background text-text-muted
              ">
                <span className="text-4xl">🍽️</span>
              </div>
            )}

            {/* Indisponible overlay */}
            {!product.isAvailable && (
              <div className="
                absolute inset-0
                bg-black/70 backdrop-blur-sm
                flex items-center justify-center
              ">
                <span className="
                  text-xs font-display text-white uppercase
                  rotate-[-15deg]
                ">
                  Sold Out
                </span>
              </div>
            )}
          </motion.div>

          {/* Badge "+ Ajouter" qui apparaît au hover */}
          <div className="
            absolute -bottom-2 left-1/2 -translate-x-1/2
            opacity-0 group-hover:opacity-100
            transition-opacity duration-300
          ">
            <div className="
              bg-primary text-black
              px-3 py-1 rounded-full
              font-display text-xs font-bold
              flex items-center gap-1
              shadow-lg
              whitespace-nowrap
            ">
              <Plus className="w-3 h-3" />
              Ajouter
            </div>
          </div>
        </div>
      </div>
    </motion.button>
  );
}

/**
 * 🌟 HERO DISH VARIANT
 * Grande carte verticale pour mise en avant (best-sellers, chef's choice)
 * - Image dominante en haut
 * - Bandeau orange avec accroche
 * - Bouton pill étendu
 */
function HeroDishCard({ product, onClick, index = 0 }: ProductCardProps) {
  const imageUrl = getPrimaryProductImage(product);
  const isBestSeller = product.aiTags?.includes('best-seller');

  return (
    <motion.div
      className="
        bg-background-surface
        border border-primary/20
        rounded-3xl overflow-hidden
        w-full
        group
        relative
      "
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 24,
        delay: index * 0.05,
      }}
    >
      {/* Image Grande */}
      <motion.div
        layoutId={`product-image-${product.id}`}
        className="relative w-full aspect-4/3 bg-background"
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority={true}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-text-muted">
            <span className="text-6xl">🍽️</span>
          </div>
        )}

        {/* Overlay gradient */}
        <div className="
          absolute inset-0
          bg-linear-to-t from-black/80 via-transparent to-transparent
        " />

        {/* Bandeau Accroche (Top Right) */}
        <div className="absolute top-4 right-4">
          <div className="
            bg-primary text-black
            px-4 py-2 rounded-full
            font-display text-sm font-bold uppercase
            shadow-2xl
          ">
            {isBestSeller ? "🔥 Best Seller" : "⭐ Chef's Choice"}
          </div>
        </div>

        {/* Indisponible */}
        {!product.isAvailable && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
            <span className="
              glass-panel px-6 py-3 rounded-full
              font-display text-lg font-bold text-white uppercase
            ">
              Indisponible
            </span>
          </div>
        )}
      </motion.div>

      {/* Contenu */}
      <div className="p-6 space-y-4">
        {/* Titre */}
        <motion.h3
          layoutId={`product-title-${product.id}`}
          className="
            font-display text-2xl text-text-primary
            uppercase tracking-wide
          "
        >
          {product.name}
        </motion.h3>

        {/* Description */}
        {product.description && (
          <p className="
            text-text-secondary text-sm
            line-clamp-3 leading-relaxed
          ">
            {product.description}
          </p>
        )}

        {/* Allergènes et tags */}
        {product.allergens && product.allergens.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {product.allergens.map((allergen) => (
              <span
                key={allergen}
                className="
                  text-xs px-2 py-1 rounded
                  bg-orange-500/10 text-orange-300
                  border border-orange-500/20
                "
              >
                {allergen}
              </span>
            ))}
          </div>
        )}

        {/* Prix et Bouton */}
        <div className="flex items-center justify-between pt-2">
          <motion.p
            layoutId={`product-price-${product.id}`}
            className="font-display text-3xl font-bold text-primary"
          >
            {formatCurrency(product.price)}
          </motion.p>

          {product.preparationTime && (
            <span className="text-sm text-text-muted">
              ~{product.preparationTime}min
            </span>
          )}
        </div>

        {/* Bouton Pill Étendu */}
        <button
          onClick={onClick}
          className="
            w-full
            bg-primary hover:bg-primary-500
            text-black font-display font-bold text-lg
            py-4 rounded-full
            flex items-center justify-center gap-2
            transition-all duration-300
            hover:shadow-xl hover:shadow-primary/40
            hover:scale-[1.02]
            active:scale-95
          "
        >
          <Plus className="w-5 h-5" />
          Ajouter au panier
        </button>
      </div>
    </motion.div>
  );
}

/**
 * MAIN COMPONENT
 * Switch entre les variantes selon la prop
 */
function ProductCardComponent({
  product,
  onClick,
  variant = 'bistro-row',
  index = 0,
}: ProductCardProps) {
  if (variant === 'hero') {
    return <HeroDishCard product={product} onClick={onClick} index={index} />;
  }

  return <BistroRowCard product={product} onClick={onClick} index={index} />;
}

// Export memoized version for performance
export const ProductCard = memo(ProductCardComponent);
