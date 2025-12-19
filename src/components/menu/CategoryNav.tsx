'use client';

import { motion } from 'framer-motion';
import { useRef, useEffect, useMemo } from 'react';
import type { Category } from '@/types/schema';

interface CategoryNavProps {
  categories: Category[];
  activeCategory: string | null;
  onCategoryChange: (categoryId: string | null) => void;
}

/**
 * Horizontal category navigation with animated underline
 * Simple style with "Tous" as first option
 */
export function CategoryNav({
  categories,
  activeCategory,
  onCategoryChange,
}: CategoryNavProps) {
  const navRef = useRef<HTMLDivElement>(null);

  // Auto-scroll active category into view
  useEffect(() => {
    if (!activeCategory || !navRef.current) return;

    const activeButton = navRef.current.querySelector(
      `[data-category-id="${activeCategory}"]`
    ) as HTMLButtonElement;

    if (activeButton) {
      activeButton.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [activeCategory]);

  // ⚡ PERF: Memoize allCategories pour éviter recréation à chaque render
  const allCategories = useMemo(() => [
    { id: null, name: 'Tous' },
    ...categories.map((cat) => ({ id: cat.id, name: cat.name })),
  ], [categories]);

  return (
    <div className="sticky top-16 z-40 bg-background/90 backdrop-blur-xl border-b border-white/10">
      <div
        ref={navRef}
        className="flex gap-6 overflow-x-auto px-4 py-3 scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {allCategories.map((category) => {
          const isActive = category.id === activeCategory;

          return (
            <button
              key={category.id || 'all'}
              data-category-id={category.id}
              onClick={() => onCategoryChange(category.id)}
              className="relative flex-shrink-0 whitespace-nowrap touch-feedback"
            >
              {/* Category Text */}
              <span
                className={`
                  font-display text-base font-semibold uppercase tracking-wide transition-colors duration-200
                  ${
                    isActive
                      ? 'text-text-primary'
                      : 'text-text-secondary hover:text-primary/80'
                  }
                `}
              >
                {category.name}
              </span>

              {/* Animated Underline */}
              {isActive && (
                <motion.div
                  layoutId="category-underline"
                  className="absolute -bottom-3 left-0 right-0 h-0.5 rounded-full"
                  style={{ backgroundColor: 'var(--brand-color, #FF4500)' }}
                  initial={false}
                  transition={{
                    type: 'spring',
                    stiffness: 500,
                    damping: 30,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Hide scrollbar CSS */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
