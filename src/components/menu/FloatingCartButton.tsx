'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/lib/store';
import { formatCurrency } from '@/lib/utils';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { useEffect, useRef, useState } from 'react';

interface FloatingCartButtonProps {
  onClick: () => void;
}

/**
 * Floating Action Button (FAB) for cart
 * - Glassmorphism style
 * - Hides on scroll down, shows on scroll up
 * - Shake animation on cart update
 * - Real-time cart total display
 */
export function FloatingCartButton({ onClick }: FloatingCartButtonProps) {
  const { items, getTotalItems, getTotalAmount } = useCartStore();
  const scrollDirection = useScrollDirection({ threshold: 10 });
  const [shouldShake, setShouldShake] = useState(false);
  const prevItemsLengthRef = useRef(0);
  const shakeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const totalItems = getTotalItems();
  const totalAmount = getTotalAmount();

  // Trigger shake animation when cart changes
  useEffect(() => {
    // Only shake on new items added (not on initial render)
    if (items.length > prevItemsLengthRef.current && totalItems > 0) {
      // Use queueMicrotask to avoid ESLint warning about setState in effect
      queueMicrotask(() => {
        setShouldShake(true);
        shakeTimeoutRef.current = setTimeout(() => setShouldShake(false), 500);
      });
    }
    prevItemsLengthRef.current = items.length;
  }, [items.length, totalItems]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (shakeTimeoutRef.current) {
        clearTimeout(shakeTimeoutRef.current);
      }
    };
  }, []);

  // Don't show if cart is empty
  if (totalItems === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed bottom-6 left-0 right-0 z-50 px-4"
        initial={{ y: 100, opacity: 0 }}
        animate={{
          y: scrollDirection === 'down' ? 100 : 0,
          opacity: scrollDirection === 'down' ? 0 : 1,
        }}
        exit={{ y: 100, opacity: 0 }}
        transition={{
          type: 'spring',
          stiffness: 260,
          damping: 20,
        }}
      >
        <motion.button
          onClick={onClick}
          className={`
            glass-fab w-full rounded-2xl px-6 py-4 touch-feedback
            flex items-center justify-between
            shadow-2xl
            ${shouldShake ? 'animate-shake' : ''}
          `}
          whileTap={{ scale: 0.98 }}
          style={{
            backgroundColor: 'var(--glass-fab-bg)',
          }}
        >
          {/* Cart Icon + Count */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <ShoppingCart
                size={24}
                strokeWidth={2}
                style={{ color: 'var(--brand-color)' }}
              />
              {/* Badge */}
              <motion.div
                className="absolute -top-2 -right-2 min-w-[20px] h-5 rounded-full flex items-center justify-center px-1.5"
                style={{
                  backgroundColor: 'var(--brand-color)',
                }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 15 }}
              >
                <span className="text-xs font-bold text-white">{totalItems}</span>
              </motion.div>
            </div>

            <div className="text-left">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Voir mon panier
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {totalItems} {totalItems === 1 ? 'article' : 'articles'}
              </p>
            </div>
          </div>

          {/* Total Amount */}
          <div className="text-right">
            <p className="text-lg font-bold" style={{ color: 'var(--brand-color)' }}>
              {formatCurrency(totalAmount)}
            </p>
          </div>
        </motion.button>
      </motion.div>
    </AnimatePresence>
  );
}
