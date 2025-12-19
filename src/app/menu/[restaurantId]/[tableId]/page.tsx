'use client';

import { useState, useEffect, use, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Search, X, Package } from 'lucide-react';
import { MobileShell } from '@/components/layout/MobileShell';
import { CategoryNav } from '@/components/menu/CategoryNav';
import { MenuGrid } from '@/components/menu/MenuGrid';
import { FloatingCartButton } from '@/components/menu/FloatingCartButton';
import { CartDrawer } from '@/components/client/CartDrawer';
import { OrderTracker } from '@/components/client/OrderTracker';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ReviewModal } from '@/components/client/ReviewModal';
import { RestaurantService } from '@/services/RestaurantService';
import { InternalReviewService } from '@/services/InternalReviewService';
import { OrderService } from '@/services/OrderService';
import { WaiterCallService } from '@/services/WaiterCallService';
import { useCartStore } from '@/lib/store';
import { useMenuData } from '@/hooks/useMenuData';
import { getOrCreateCustomerSessionId } from '@/lib/utils';
import { toast } from 'sonner';
import type { Restaurant, Category, Order } from '@/types/schema';

// Dynamic import AI Chat Bubble (non-critical feature)
const AIChatBubble = dynamic(
  () => import('@/components/menu/AIChatBubble').then((mod) => mod.AIChatBubble),
  { ssr: false }
);

// Dynamic import Social Camera (heavy with face-api.js) - ONLY load on demand
const SocialCamera = dynamic(
  () => import('@/components/client/SocialCamera').then((mod) => mod.SocialCamera),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="text-white text-lg">Chargement de la caméra...</div>
      </div>
    ),
  }
);

interface PageProps {
  params: Promise<{
    restaurantId: string;
    tableId: string;
  }>;
}

/**
 * Customer Menu Page with Premium UX + Real-time Menu Data
 * - Mobile-first design with glassmorphism
 * - Smooth animations (60fps)
 * - Real-time categories and products (Firestore listeners)
 * - Auto-filters unavailable products (isAvailable === false)
 * - Groups products by category
 * - Drawer for product details (vaul)
 * - Floating cart button (FAB)
 */
export default function MenuPage({ params: paramsPromise }: PageProps) {
  const params = use(paramsPromise);
  const { restaurantId, tableId } = params;

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loadingRestaurant, setLoadingRestaurant] = useState(true);
  const [actualRestaurantId, setActualRestaurantId] = useState<string | null>(null);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [socialCameraOpen, setSocialCameraOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [orderTrackerOpen, setOrderTrackerOpen] = useState(false);
  const [activeOrdersCount, setActiveOrdersCount] = useState(0);

  const { setContext } = useCartStore();
  const customerSessionId = getOrCreateCustomerSessionId();

  // Subscribe to orders to track active count
  useEffect(() => {
    if (!actualRestaurantId || !tableId || !customerSessionId) return;

    console.log('[OrderTracker] Subscribing to orders:', {
      restaurantId: actualRestaurantId,
      tableId,
      customerSessionId,
    });

    const unsubscribe = OrderService.subscribeToTableOrders(
      actualRestaurantId,
      tableId,
      customerSessionId,
      (orders) => {
        console.log('[OrderTracker] Orders updated:', orders);
        const activeCount = (orders as Order[]).filter(
          (o) => o.status !== 'served' && o.status !== 'rejected'
        ).length;
        console.log('[OrderTracker] Active orders count:', activeCount);
        setActiveOrdersCount(activeCount);
      }
    );

    return () => unsubscribe();
  }, [actualRestaurantId, tableId, customerSessionId]);

  // Fetch restaurant info (one-time)
  useEffect(() => {
    let mounted = true;

    const fetchRestaurant = async () => {
      try {
        // console.log('[MENU] 🍽️  Fetching restaurant:', restaurantId);
        setLoadingRestaurant(true);

        // Try to fetch restaurant by slug first, fallback to ID
        let fetchedRestaurant = await RestaurantService.getBySlug(restaurantId);

        // If not found by slug, try by ID (backward compatibility)
        if (!fetchedRestaurant) {
          fetchedRestaurant = await RestaurantService.getById(restaurantId);
        }

        // Check if restaurant exists
        if (!fetchedRestaurant) {
          toast.error('Restaurant introuvable');
          setLoadingRestaurant(false);
          return;
        }

        if (!mounted) return;

        setRestaurant(fetchedRestaurant);
        setActualRestaurantId(fetchedRestaurant.id);

        // Set cart context with actual restaurant ID
        setContext(fetchedRestaurant.id, tableId);

        // console.log('[MENU] ✅ Restaurant loaded:', fetchedRestaurant.name);
      } catch (error) {
        if (!mounted) return;
        console.error('[MENU] ❌ Failed to fetch restaurant:', error);
        toast.error('Erreur lors du chargement du restaurant');
      } finally {
        if (mounted) {
          setLoadingRestaurant(false);
        }
      }
    };

    fetchRestaurant();

    // Cleanup function
    return () => {
      mounted = false;
    };
  }, [restaurantId, tableId, setContext]);

  // Use the menu data hook (real-time listeners)
  const { loading: loadingMenu, data: categoriesWithItems, error: menuError } = useMenuData(
    actualRestaurantId || ''
  );

  // Extract categories and products
  const categories: Category[] = categoriesWithItems.map((cat) => ({
    id: cat.id,
    name: cat.name,
    order: cat.order,
    icon: cat.icon,
    restaurantId: actualRestaurantId || '',
    isAvailable: true,
    createdAt: new Date(),
  }));

  // Get all products (flattened from categories)
  const allProducts = categoriesWithItems.flatMap((cat) => cat.items);

  // Handle call waiter - Send request to admin
  const handleCallWaiter = async () => {
    if (!actualRestaurantId) {
      toast.error('Erreur: Restaurant non trouvé');
      return;
    }

    try {
      await WaiterCallService.createCall(
        actualRestaurantId,
        tableId,
        `Table ${tableId}`
      );
      toast.success('Un serveur arrive à votre table ! 🔔');
    } catch (error) {
      console.error('[Menu] Error calling waiter:', error);
      toast.error('Erreur lors de l\'appel du serveur');
    }
  };

  // Handle view cart - Opens cart drawer
  const handleViewCart = () => {
    setCartDrawerOpen(true);
  };

  // Handle review submission (internal feedback)
  const handleSubmitInternalReview = async (review: {
    rating: number;
    comment: string;
    email?: string;
  }) => {
    if (!actualRestaurantId) {
      throw new Error('Restaurant ID not available');
    }

    await InternalReviewService.createReview({
      restaurantId: actualRestaurantId,
      tableId: tableId,
      rating: review.rating,
      comment: review.comment,
      email: review.email,
    });
  };

  // Combined loading state
  const loading = loadingRestaurant || loadingMenu;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Chargement du menu..." />
      </div>
    );
  }

  // Show error if menu failed to load
  if (menuError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Erreur de chargement
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Impossible de charger le menu. Veuillez réessayer.
          </p>
        </div>
      </div>
    );
  }

  // Get branding with fallback defaults
  const branding = restaurant?.branding || {
    primaryColor: '#FF4500',
    secondaryColor: '#FFF5F0',
    fontFamily: 'sans' as const,
    radius: 'md' as const,
  };

  return (
    <ThemeProvider branding={branding}>
      <MobileShell
        restaurantName={restaurant?.name || 'Restaurant'}
        restaurantId={actualRestaurantId || undefined}
        tableId={tableId}
        logo={restaurant?.branding?.logoUrl || restaurant?.branding?.logo}
        onCallWaiter={handleCallWaiter}
        products={allProducts}
      >
        {/* Category Navigation (Horizontal Pills) */}
        {categories.length > 0 && (
          <div className="sticky top-16 z-40 -mx-4">
            <CategoryNav
              categories={categories}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />
          </div>
        )}

        {/* Search Bar */}
        <div className="mt-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un plat..."
              className="w-full pl-12 pr-12 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Single Menu Grid with Category Filtering */}
        <div className="mt-6">
          <MenuGrid
            products={allProducts}
            activeCategory={activeCategory}
            searchQuery={searchQuery}
            loading={loadingMenu}
          />
        </div>

        {/* Social Studio CTA - Instagram Story Style */}
        <div className="mt-12 mb-4 glass-panel rounded-2xl p-6 text-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
          <div className="text-4xl mb-3">📸</div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            Immortalisez votre moment !
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Créez une photo stylée avec nos templates viraux
          </p>
          <button
            onClick={() => setSocialCameraOpen(true)}
            className="px-6 py-3 rounded-xl font-semibold text-white transition-transform hover:scale-105 active:scale-95 shadow-lg bg-gradient-to-r from-purple-500 to-pink-500"
          >
            📷 Ouvrir Social Studio
          </button>
        </div>

        {/* Review CTA Section - Encourage feedback */}
        <div className="mt-4 mb-8 glass-panel rounded-2xl p-6 text-center">
          <div className="text-4xl mb-3">⭐</div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            Votre avis nous intéresse !
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Partagez votre expérience avec nous
          </p>
          <button
            onClick={() => setReviewModalOpen(true)}
            className="px-6 py-3 rounded-xl font-semibold text-white transition-transform hover:scale-105 active:scale-95 shadow-lg"
            style={{ backgroundColor: 'var(--brand-color, #FF4500)' }}
          >
            Donner mon avis
          </button>
        </div>

        {/* Floating Cart Button */}
        <FloatingCartButton onClick={handleViewCart} />

        {/* Floating Order Tracker Button */}
        {actualRestaurantId && activeOrdersCount > 0 && (
          <div className="fixed bottom-24 right-4 z-40">
            <button
              onClick={() => setOrderTrackerOpen(!orderTrackerOpen)}
              className="relative w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
              aria-label="Voir mes commandes"
            >
              <Package className="w-6 h-6" />
              {/* Badge with count */}
              {activeOrdersCount > 0 && (
                <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                  {activeOrdersCount}
                </span>
              )}
            </button>
          </div>
        )}

        {/* AI Chat Bubble - Lazy loaded */}
        <Suspense fallback={null}>
          <AIChatBubble restaurantId={restaurantId} />
        </Suspense>
      </MobileShell>

      {/* Cart Drawer */}
      {restaurant && (
        <CartDrawer
          open={cartDrawerOpen}
          onOpenChange={setCartDrawerOpen}
          restaurantId={restaurant.id}
          tableId={tableId}
          tableLabelString={tableId.startsWith('table-') ? `Table ${tableId.split('-')[1]}` : tableId === 'online' ? 'Commande en ligne' : `Table ${tableId}`}
          customerSessionId={customerSessionId}
        />
      )}

      {/* Review Modal - Smart Review System */}
      {restaurant && actualRestaurantId && (
        <ReviewModal
          isOpen={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          restaurantName={restaurant.name}
          restaurantId={actualRestaurantId}
          tableId={tableId}
          googleReviewUrl={(restaurant as any).googleReviewUrl}
          onSubmitInternalReview={handleSubmitInternalReview}
        />
      )}

      {/* Social Camera - Instagram Story Style */}
      {restaurant && actualRestaurantId && socialCameraOpen && (
        <SocialCamera
          isOpen={socialCameraOpen}
          onClose={() => setSocialCameraOpen(false)}
          restaurantName={restaurant.name}
          restaurantLogo={restaurant.branding?.logoUrl}
          menuUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/menu/${restaurantId}/${tableId}`}
          primaryColor={restaurant.branding?.primaryColor}
        />
      )}

      {/* Order Tracker - Real-time Order Status */}
      {actualRestaurantId && (
        <OrderTracker
          restaurantId={actualRestaurantId}
          tableId={tableId}
          customerSessionId={customerSessionId}
          isOpen={orderTrackerOpen}
          onClose={() => setOrderTrackerOpen(false)}
        />
      )}
    </ThemeProvider>
  );
}
