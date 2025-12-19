'use client';

import { motion } from 'framer-motion';
import { memo } from 'react';

export interface Category {
  id: string;
  name: string;
  icon?: string;
  count?: number;
}

interface CategoryPillsProps {
  categories: Category[];
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

/**
 * 🔥 CATEGORY PILLS
 * Navigation par capsules avec style "Orange Bistro"
 * - Inactif: Transparent + bordure blanche
 * - Actif: Fond orange + texte noir (contraste fort)
 * - Animations fluides avec framer-motion
 */
function CategoryPillsComponent({
  categories,
  activeCategory,
  onCategoryChange,
}: CategoryPillsProps) {
  return (
    <div className="w-full overflow-x-auto scrollbar-hide pb-4">
      {/* Container avec scroll horizontal */}
      <div className="flex gap-3 px-4 min-w-max">
        {categories.map((category, index) => {
          const isActive = activeCategory === category.id;

          return (
            <motion.button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={`
                relative px-6 py-3 rounded-full
                font-display font-bold text-sm uppercase
                border-2 transition-all duration-300
                whitespace-nowrap
                ${
                  isActive
                    ? 'bg-primary border-primary text-black shadow-lg shadow-primary/30'
                    : 'bg-transparent border-white/30 text-text-primary hover:border-primary/50'
                }
              `}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 24,
                delay: index * 0.05,
              }}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: isActive ? 1 : 1.05 }}
            >
              {/* Icon (optionnel) */}
              {category.icon && (
                <span className="mr-2 text-base">{category.icon}</span>
              )}

              {/* Nom de la catégorie */}
              <span>{category.name}</span>

              {/* Count badge (optionnel) */}
              {category.count !== undefined && (
                <span
                  className={`
                    ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold
                    ${
                      isActive
                        ? 'bg-black/20 text-black'
                        : 'bg-primary/20 text-primary'
                    }
                  `}
                >
                  {category.count}
                </span>
              )}

              {/* Active indicator (barre orange en bas) */}
              {isActive && (
                <motion.div
                  layoutId="category-active-indicator"
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2/3 h-1 bg-primary rounded-full"
                  transition={{
                    type: 'spring',
                    stiffness: 500,
                    damping: 30,
                  }}
                />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Scrollbar custom CSS (optionnel) */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

export const CategoryPills = memo(CategoryPillsComponent);
