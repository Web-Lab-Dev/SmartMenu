// ========================================
// ProductDrawer Component
// ========================================
// Bottom drawer for complete product details with Vaul

'use client';

import { useState } from 'react';
import { Drawer } from 'vaul';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { X, ShoppingCart, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import type { Product } from '@/types/schema';
import { useCartStore } from '@/lib/store';
import { toast } from 'sonner';

interface ProductDrawerProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * ProductDrawer - Full product details in bottom drawer
 * - Image carousel
 * - Complete description
 * - Allergens
 * - Options selection
 * - Sticky "Add to Cart" button at bottom
 */
export function ProductDrawer({ product, isOpen, onClose }: ProductDrawerProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCartStore();

  if (!product) return null;

  // Handle multiple images - use images array or fallback to legacy image field
  const images = product.images && product.images.length > 0
    ? product.images
    : product.image
    ? [product.image]
    : [];
  const hasMultipleImages = images.length > 1;

  const handleAddToCart = () => {
    try {
      addItem(product, quantity);
      toast.success(`${product.name} ajouté au panier`);
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur');
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Drawer.Content
          className="fixed bottom-0 left-0 right-0 z-50 flex flex-col bg-white dark:bg-gray-900 rounded-t-3xl max-h-[95vh]"
          aria-describedby="product-description"
        >
          {/* Hidden Title for accessibility */}
          <Drawer.Title className="sr-only">{product.name}</Drawer.Title>

          {/* Handle Bar */}
          <div className="flex justify-center py-4 border-b border-gray-200 dark:border-gray-800">
            <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full" />
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center z-10"
            aria-label="Fermer"
          >
            <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Image Carousel */}
            {images.length > 0 && (
              <div className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-800">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentImageIndex}
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0"
                  >
                    <Image
                      src={images[currentImageIndex]!}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="100vw"
                      priority
                    />
                  </motion.div>
                </AnimatePresence>

                {/* Navigation Arrows (if multiple images) */}
                {hasMultipleImages && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-lg flex items-center justify-center"
                    >
                      <ChevronLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-lg flex items-center justify-center"
                    >
                      <ChevronRight className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                    </button>

                    {/* Image Indicators */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {images.map((_, idx) => (
                        <div
                          key={idx}
                          className={`h-2 rounded-full transition-all ${
                            idx === currentImageIndex
                              ? 'w-8 bg-white'
                              : 'w-2 bg-white/50'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Product Details */}
            <div className="p-6 space-y-6">
              {/* Header */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {product.name}
                </h2>
                <div
                  className="text-3xl font-bold"
                  style={{ color: 'var(--brand-color)' }}
                >
                  {(product.price / 100).toLocaleString()} FCFA
                </div>
              </div>

              {/* Description */}
              {product.description && (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Description
                  </h3>
                  <p id="product-description" className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Allergens */}
              {product.allergens && product.allergens.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Allergènes
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.allergens.map((allergen) => (
                      <span
                        key={allergen}
                        className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded-full text-sm font-medium"
                      >
                        {allergen}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Options (for future) */}
              {product.options && product.options.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                    Options
                  </h3>
                  {product.options.map((option) => (
                    <div key={option.name} className="mb-4">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {option.name}
                        {option.required && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </div>
                      <div className="space-y-2">
                        {option.values.map((value) => (
                          <label
                            key={value.name}
                            className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                          >
                            <input
                              type={option.required ? 'radio' : 'checkbox'}
                              name={option.name}
                              className="w-4 h-4"
                              style={{ accentColor: 'var(--brand-color)' }}
                            />
                            <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                              {value.name}
                            </span>
                            {value.priceModifier && value.priceModifier > 0 && (
                              <span className="text-sm text-gray-500">
                                +{value.priceModifier} FCFA
                              </span>
                            )}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Quantity Selector */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Quantité
                </h3>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-12 h-12 rounded-full border-2 flex items-center justify-center font-bold text-xl"
                    style={{ borderColor: 'var(--brand-color)', color: 'var(--brand-color)' }}
                  >
                    −
                  </button>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white w-12 text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl text-white"
                    style={{ backgroundColor: 'var(--brand-color)' }}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Bottom Padding for sticky button */}
              <div className="h-24" />
            </div>
          </div>

          {/* Sticky Add to Cart Button */}
          <div className="sticky bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-lg">
            <motion.button
              onClick={handleAddToCart}
              className="w-full py-4 rounded-2xl font-bold text-lg text-white flex items-center justify-center gap-3 shadow-lg"
              style={{ backgroundColor: 'var(--brand-color)' }}
              whileTap={{ scale: 0.98 }}
            >
              <ShoppingCart className="w-6 h-6" />
              Ajouter au panier - {((product.price / 100) * quantity).toLocaleString()} FCFA
            </motion.button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
