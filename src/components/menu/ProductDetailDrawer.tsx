'use client';

import { Drawer } from 'vaul';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useState } from 'react';
import { Plus, Minus, X } from 'lucide-react';
import type { Product, OrderItemOption } from '@/types/schema';
import { formatCurrency } from '@/lib/utils';
import { useCartStore } from '@/lib/store';
import { toast } from 'sonner';

interface ProductDetailDrawerProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Product detail drawer with vaul (iOS-style bottom sheet)
 * - Shared Layout Animation with ProductCard
 * - Quantity selector
 * - Options selector (size, cuisson, etc.)
 * - Add to cart functionality
 */
export function ProductDetailDrawer({
  product,
  isOpen,
  onClose,
}: ProductDetailDrawerProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<OrderItemOption[]>([]);
  const { addItem } = useCartStore();

  if (!product) return null;

  const handleAddToCart = () => {
    try {
      addItem(product, quantity, selectedOptions.length > 0 ? selectedOptions : undefined);
      toast.success(`${product.name} ajouté au panier !`);
      onClose();
      // Reset state
      setQuantity(1);
      setSelectedOptions([]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'ajout au panier');
    }
  };

  const totalPrice = product.price * quantity;

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-3xl glass-panel max-h-[90vh]">
          {/* Drawer Handle */}
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 dark:bg-gray-600 my-4" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full glass-panel flex items-center justify-center touch-feedback"
          >
            <X size={20} />
          </button>

          {/* Scrollable Content */}
          <div className="overflow-y-auto flex-1 px-4 pb-4">
            {/* Product Image - Shared Layout Animation */}
            <motion.div
              layoutId={`product-image-${product.id}`}
              className="relative w-full aspect-square rounded-2xl overflow-hidden mb-6 bg-gray-100 dark:bg-gray-800"
            >
              {product.image ? (
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="100vw"
                  priority
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <span className="text-6xl">🍽️</span>
                </div>
              )}
            </motion.div>

            {/* Product Info */}
            <div className="space-y-4">
              <div>
                <motion.h2
                  layoutId={`product-title-${product.id}`}
                  className="text-2xl font-bold text-gray-900 dark:text-white mb-2"
                >
                  {product.name}
                </motion.h2>

                <motion.p
                  layoutId={`product-price-${product.id}`}
                  className="text-xl font-bold mb-3"
                  style={{ color: 'var(--brand-color)' }}
                >
                  {formatCurrency(product.price)}
                </motion.p>

                {product.description && (
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {product.description}
                  </p>
                )}
              </div>

              {/* Preparation Time */}
              {product.preparationTime && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span>⏱️</span>
                  <span>Temps de préparation: ~{product.preparationTime}min</span>
                </div>
              )}

              {/* Allergens */}
              {product.allergens && product.allergens.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Allergènes:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {product.allergens.map((allergen) => (
                      <span
                        key={allergen}
                        className="text-sm px-3 py-1.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
                      >
                        {allergen}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity Selector */}
              <div className="space-y-2 pt-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Quantité:
                </p>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="w-12 h-12 rounded-xl glass-panel flex items-center justify-center touch-feedback disabled:opacity-50"
                    style={{ color: 'var(--brand-color)' }}
                  >
                    <Minus size={20} />
                  </button>

                  <span className="text-2xl font-bold min-w-[40px] text-center">
                    {quantity}
                  </span>

                  <button
                    onClick={() => setQuantity(Math.min(99, quantity + 1))}
                    disabled={quantity >= 99}
                    className="w-12 h-12 rounded-xl glass-panel flex items-center justify-center touch-feedback disabled:opacity-50"
                    style={{ color: 'var(--brand-color)' }}
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Fixed Bottom - Add to Cart Button */}
          <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700">
            <motion.button
              onClick={handleAddToCart}
              disabled={!product.isAvailable}
              className="w-full rounded-2xl px-6 py-4 font-semibold text-white touch-feedback disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: 'var(--brand-color)' }}
              whileTap={{ scale: product.isAvailable ? 0.98 : 1 }}
            >
              {product.isAvailable ? (
                <span className="flex items-center justify-between">
                  <span>Ajouter au panier</span>
                  <span>{formatCurrency(totalPrice)}</span>
                </span>
              ) : (
                <span>Produit indisponible</span>
              )}
            </motion.button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
