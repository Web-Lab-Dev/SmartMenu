// ========================================
// Admin Layout Component
// ========================================
// Dark mode layout with sidebar for admin dashboard

'use client';

import { ReactNode, useState, useMemo, memo, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { InternalReviewService } from '@/services/InternalReviewService';
import { OrderService } from '@/services/OrderService';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Settings,
  LogOut,
  Store,
  Gift,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShoppingBag,
  MessageSquare,
} from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminLayoutProps {
  children: ReactNode;
  onAIAssistantToggle?: (isOpen: boolean) => void;
  isAIAssistantOpen?: boolean;
}

interface NavItem {
  href: string;
  icon: typeof LayoutDashboard;
  label: string;
}

const navItems: NavItem[] = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/orders', icon: ShoppingBag, label: 'Commandes' },
  { href: '/admin/menu', icon: UtensilsCrossed, label: 'Menu Editor' },
  { href: '/admin/marketing', icon: Gift, label: 'Marketing' },
  { href: '/admin/reviews', icon: MessageSquare, label: 'Avis Clients' },
  { href: '/admin/settings', icon: Settings, label: 'Settings' },
];

/**
 * Admin Layout with dark mode and sidebar navigation
 * - Forces dark mode for kitchen displays
 * - Protects routes with useAdminAuth
 * - Sidebar navigation with active state
 * - Collapsible sidebar
 * - AI Assistant panel support
 */
export function AdminLayout({ children, onAIAssistantToggle, isAIAssistantOpen = false }: AdminLayoutProps) {
  const { user, loading, isAuthorized, restaurantId } = useAdminAuth();
  const { signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [unreadReviewsCount, setUnreadReviewsCount] = useState(0);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);

  // Load unread reviews count
  useEffect(() => {
    if (!restaurantId) return;

    const loadUnreadCount = async () => {
      try {
        const count = await InternalReviewService.getUnreadCount(restaurantId);
        setUnreadReviewsCount(count);
      } catch (error) {
        console.error('[AdminLayout] Error loading unread reviews count:', error);
      }
    };

    loadUnreadCount();

    // Refresh count every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [restaurantId]);

  // Load pending orders count (real-time)
  useEffect(() => {
    if (!restaurantId) return;

    const unsubscribe = OrderService.subscribeToOrders(restaurantId, (orders) => {
      const pendingCount = orders.filter(
        (order) => order.status === 'pending_validation' || order.status === 'preparing'
      ).length;
      setPendingOrdersCount(pendingCount);
    });

    return () => unsubscribe();
  }, [restaurantId]);

  // Collapse sidebar when AI Assistant opens
  useEffect(() => {
    if (isAIAssistantOpen) {
      setIsSidebarCollapsed(true);
    }
  }, [isAIAssistantOpen]);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await signOut();
      toast.success('Déconnexion réussie');
      router.push('/login');
    } catch (error) {
      logger.error('[AdminLayout] Logout error:', error);
      toast.error('Erreur lors de la déconnexion');
    } finally {
      setIsLoggingOut(false);
    }
  };

  // PERF: Don't block UI with spinner - show layout immediately
  // Redirect happens in useAdminAuth hook if unauthorized

  return (
    <div className="dark min-h-screen bg-gray-950 text-white print:bg-white">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarCollapsed ? '80px' : '256px' }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="fixed left-0 top-0 h-full bg-gray-900 border-r border-gray-800 z-40"
      >
        {/* Logo / Restaurant Name */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shrink-0">
              <Store className="w-6 h-6 text-white" />
            </div>
            {!isSidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-lg truncate">
                  {user?.restaurantName || 'Mon Restaurant'}
                </h2>
                <p className="text-xs text-gray-400">Admin Dashboard</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const isReviewsPage = item.href === '/admin/reviews';
            const isOrdersPage = item.href === '/admin/orders';
            const reviewBadgeCount = isReviewsPage ? unreadReviewsCount : 0;
            const orderBadgeCount = isOrdersPage ? pendingOrdersCount : 0;
            const badgeCount = reviewBadgeCount || orderBadgeCount;
            const showBadge = badgeCount > 0;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-colors relative
                  ${
                    isActive
                      ? 'bg-orange-500/10 text-orange-500 font-medium'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }
                  ${isSidebarCollapsed ? 'justify-center' : ''}
                `}
                title={isSidebarCollapsed ? item.label : undefined}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!isSidebarCollapsed && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {showBadge && (
                      <span className="px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded-full">
                        {badgeCount}
                      </span>
                    )}
                  </>
                )}
                {isSidebarCollapsed && showBadge && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {badgeCount > 9 ? '9+' : badgeCount}
                  </span>
                )}
              </Link>
            );
          })}

          {/* AI Assistant Button in Sidebar */}
          {onAIAssistantToggle && (
            <button
              onClick={() => onAIAssistantToggle(!isAIAssistantOpen)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                ${
                  isAIAssistantOpen
                    ? 'bg-purple-500/10 text-purple-500 font-medium'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }
                ${isSidebarCollapsed ? 'justify-center' : ''}
              `}
              title={isSidebarCollapsed ? 'Assistant IA' : undefined}
            >
              <Sparkles className="w-5 h-5 shrink-0" />
              {!isSidebarCollapsed && <span>Assistant IA</span>}
            </button>
          )}
        </nav>

        {/* Toggle Button */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-full flex items-center justify-center transition-colors z-50"
          title={isSidebarCollapsed ? 'Ouvrir la sidebar' : 'Fermer la sidebar'}
        >
          {isSidebarCollapsed ? (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-gray-400" />
          )}
        </button>

        {/* Footer: User Info + Logout */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-800 bg-gray-900">
          {/* User Profile & Logout */}
          <div className={`p-4 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
            {!isSidebarCollapsed ? (
              <>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-semibold shrink-0">
                    {user?.displayName?.[0]?.toUpperCase() || 'A'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {user?.displayName || 'Admin'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user?.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                  title="Déconnexion"
                >
                  <LogOut className={`w-4 h-4 text-gray-400 ${isLoggingOut ? 'animate-spin' : ''}`} />
                </button>
              </>
            ) : (
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-semibold hover:opacity-80 transition-opacity disabled:opacity-50"
                title="Déconnexion"
              >
                {isLoggingOut ? (
                  <LogOut className="w-4 h-4 text-white animate-spin" />
                ) : (
                  user?.displayName?.[0]?.toUpperCase() || 'A'
                )}
              </button>
            )}
          </div>

          {/* App Name */}
          {!isSidebarCollapsed && (
            <div className="px-4 pb-4 pt-2">
              <p className="text-xs text-gray-500 text-center font-medium">
                Powered by <span className="text-orange-500 font-semibold">SmartMenu</span>
              </p>
            </div>
          )}
        </div>
      </motion.aside>

      {/* Main Content */}
      <motion.main
        initial={false}
        animate={{
          marginLeft: isSidebarCollapsed ? '80px' : '256px',
          marginRight: isAIAssistantOpen ? '400px' : '0px',
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="min-h-screen bg-gray-950"
      >
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-gray-900 border-b border-gray-800">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">
                  {navItems.find((item) => item.href === pathname)?.label || 'Admin'}
                </h1>
                <p className="text-sm text-gray-400 mt-1">
                  {user?.restaurantName || 'Mon Restaurant'}
                </p>
              </div>

              {/* Live indicator */}
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm text-gray-400">En direct</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8">
          {children}
        </div>
      </motion.main>
    </div>
  );
}
