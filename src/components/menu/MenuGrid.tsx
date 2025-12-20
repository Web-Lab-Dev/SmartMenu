// ========================================
// MenuGrid Component
// ========================================
// Smart hybrid layout: Hero cards for first 2, Compact cards for rest

'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import type { Product, Campaign } from '@/types/schema';
import { HeroCard, HeroCardSkeleton } from './HeroCard';
import { CompactCard, CompactCardSkeleton } from './CompactCard';
import { useCartStore } from '@/lib/store';
import { toast } from 'sonner';

// Dynamic import ProductDrawer to avoid SSR issues with vaul
const ProductDrawer = dynamic(
  () => import('./ProductDrawer').then((mod) => mod.ProductDrawer),
  { ssr: false }
);

interface MenuGridProps {
  products: Product[];
  activeCategory: string | null;
  searchQuery?: string;
  loading?: boolean;
  // Promo data (optional)
  activeCampaign?: Campaign | null;
  getProductPrice?: (product: Product) => {
    price: number;
    originalPrice: number | null;
    hasDiscount: boolean;
  };
}

// ⚡ PERF: Externaliser les variants d'animation
const heroGridVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
};

const compactGridVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
};

const heroGridTransition = { duration: 0.3 };
const compactGridTransition = { duration: 0.3, delay: 0.2 };

const emptyStateVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

/**
 * MenuGrid - Hybrid layout for product display
 *
 * Layout Strategy:
 * - First 2 products in each category: HeroCard (large, vertical)
 * - Remaining products: CompactCard (horizontal, list-style)
 * - Click on any card opens ProductDrawer with full details
 * - Quick add button on cards adds to cart directly
 */
export function MenuGrid({
  products,
  activeCategory,
  searchQuery = '',
  loading,
  activeCampaign,
  getProductPrice
}: MenuGridProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { addItem } = useCartStore();
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ⚡ PERF: Memoize filteredProducts pour éviter recalcul à chaque render
  const filteredProducts = useMemo(() => {
    let filtered = products.filter((p) => p.isAvailable);

    // Apply category filter
    if (activeCategory) {
      filtered = filtered.filter((p) => p.categoryId === activeCategory);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [products, activeCategory, searchQuery]);

  // ⚡ PERF: Memoize split products
  const heroProducts = useMemo(() => filteredProducts.slice(0, 2), [filteredProducts]);
  const compactProducts = useMemo(() => filteredProducts.slice(2), [filteredProducts]);

  // ⚡ PERF: useCallback pour handlers
  const handleProductClick = useCallback((product: Product) => {
    setSelectedProduct(product);
    setIsDrawerOpen(true);
  }, []);

  const handleQuickAdd = useCallback((product: Product, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening drawer
    try {
      addItem(product, 1);
      toast.success(`${product.name} ajouté au panier`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur');
    }
  }, [addItem]);

  const handleCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    // Delay clearing product to allow drawer animation
    closeTimeoutRef.current = setTimeout(() => setSelectedProduct(null), 300);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Hero Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <HeroCardSkeleton />
          <HeroCardSkeleton />
        </div>

        {/* Compact Cards Skeleton */}
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <CompactCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (filteredProducts.length === 0) {
    return (
      <motion.div
        initial={emptyStateVariants.initial}
        animate={emptyStateVariants.animate}
        className="flex flex-col items-center justify-center py-16 text-center"
      >
        <span className="text-6xl mb-4">{searchQuery ? '🔍' : '🍽️'}</span>
        <h3 className="text-xl font-bold text-white mb-2">
          {searchQuery ? 'Aucun résultat' : 'Aucun produit disponible'}
        </h3>
        <p className="text-gray-400">
          {searchQuery
            ? `Aucun plat ne correspond à "${searchQuery}"`
            : activeCategory
            ? 'Aucun produit dans cette catégorie pour le moment'
            : 'Le menu est en cours de préparation'}
        </p>
      </motion.div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Hero Products (First 2) - Grid Layout */}
        {heroProducts.length > 0 && (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
            initial={heroGridVariants.initial}
            animate={heroGridVariants.animate}
            transition={heroGridTransition}
          >
            {heroProducts.map((product, idx) => {
              const priceData = getProductPrice?.(product);
              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: idx * 0.15,
                    type: 'spring',
                    stiffness: 300,
                    damping: 24
                  }}
                >
                  <HeroCard
                    product={product}
                    onClick={() => handleProductClick(product)}
                    priority={idx === 0}
                    onAddToCart={(e) => handleQuickAdd(product, e)}
                    discountedPrice={priceData?.hasDiscount ? priceData.price : undefined}
                    originalPrice={priceData?.originalPrice ?? undefined}
                    promoBadge={priceData?.hasDiscount && activeCampaign?.recurrence === 'recurring' ? 'HAPPY HOUR' : priceData?.hasDiscount ? 'PROMO' : undefined}
                  />
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Compact Products (Rest) - List Layout */}
        {compactProducts.length > 0 && (
          <motion.div
            className="space-y-3"
            initial={compactGridVariants.initial}
            animate={compactGridVariants.animate}
            transition={compactGridTransition}
          >
            {compactProducts.map((product, idx) => {
              const priceData = getProductPrice?.(product);
              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: 0.3 + idx * 0.06,
                    type: 'spring',
                    stiffness: 260,
                    damping: 20
                  }}
                >
                  <CompactCard
                    product={product}
                    onClick={() => handleProductClick(product)}
                    onAddToCart={(e) => handleQuickAdd(product, e)}
                    discountedPrice={priceData?.hasDiscount ? priceData.price : undefined}
                    originalPrice={priceData?.originalPrice ?? undefined}
                    promoBadge={priceData?.hasDiscount && activeCampaign?.recurrence === 'recurring' ? 'HAPPY HOUR' : priceData?.hasDiscount ? 'PROMO' : undefined}
                  />
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Category Count Badge */}
        <div className="flex justify-center pt-4">
          <div className="px-4 py-2 border rounded-full text-sm text-gray-400" style={{ backgroundColor: '#1E1E1E', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
            {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Product Detail Drawer */}
      <ProductDrawer
        product={selectedProduct}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
      />
    </>
  );
}
