'use client';

import { motion } from 'framer-motion';
import { Bell } from 'lucide-react';
import Image from 'next/image';
import type { Category, Product } from '@/types/schema';
import { CartObserver } from '@/components/client/CartObserver';
import { LiveOrderFeed } from '@/components/client/LiveOrderFeed';

interface MobileShellProps {
  children: React.ReactNode;
  restaurantName?: string;
  restaurantLogo?: string;
  logo?: string; // Alias for restaurantLogo
  restaurantId?: string; // Restaurant ID for live feed
  tableId?: string; // Table identifier
  categories?: Category[];
  activeCategory?: string | null;
  onCategoryChange?: (categoryId: string) => void;
  onCallWaiter?: () => void;
  products?: Product[]; // For AI upsell system
}

/**
 * Mobile app shell with sticky header and glassmorphism
 * - Sticky glass header with logo and call waiter button
 * - Sticky category navigation (rendered by parent)
 * - Main content area
 * - FAB (Floating Action Button) for cart (rendered by parent)
 */
export function MobileShell({
  children,
  restaurantName = 'Smart Menu',
  restaurantLogo,
  logo,
  restaurantId,
  tableId,
  onCallWaiter,
  products = [],
}: MobileShellProps) {
  // Use logo prop if provided, otherwise fallback to restaurantLogo
  const logoUrl = logo || restaurantLogo;
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Live Order Feed - Social Proof */}
      {restaurantId && tableId && (
        <LiveOrderFeed
          restaurantId={restaurantId}
          currentTableId={tableId}
        />
      )}

      {/* Sticky Header */}
      <header className="sticky top-0 z-50 glass-header">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo & Restaurant Name */}
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-white">
                  <Image
                    src={logoUrl}
                    alt={restaurantName}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                  <span className="text-xl">🍽️</span>
                </div>
              )}
              <div>
                <h1 className="font-bold text-gray-900 dark:text-white">
                  {restaurantName}
                </h1>
                {tableId ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Table {tableId}
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Menu digital
                  </p>
                )}
              </div>
            </div>

            {/* Call Waiter Button */}
            {onCallWaiter && (
              <motion.button
                onClick={onCallWaiter}
                className="flex items-center gap-2 px-4 py-2 rounded-full glass-panel touch-feedback"
                whileTap={{ scale: 0.95 }}
              >
                <Bell size={18} style={{ color: 'var(--brand-color)' }} />
                <span
                  className="text-sm font-medium hidden sm:inline"
                  style={{ color: 'var(--brand-color)' }}
                >
                  Appeler
                </span>
              </motion.button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 pb-32">
        {children}
      </main>

      {/* AI Cart Observer - Monitors cart changes for upsell suggestions */}
      {products.length > 0 && <CartObserver products={products} />}
    </div>
  );
}
