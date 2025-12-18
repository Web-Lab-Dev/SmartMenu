// ========================================
// Admin Layout Component
// ========================================
// Dark mode layout with sidebar for admin dashboard

'use client';

import { ReactNode, useState, useMemo, memo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Settings,
  LogOut,
  Store,
  Gift,
} from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface AdminLayoutProps {
  children: ReactNode;
}

interface NavItem {
  href: string;
  icon: typeof LayoutDashboard;
  label: string;
}

const navItems: NavItem[] = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/menu', icon: UtensilsCrossed, label: 'Menu Editor' },
  { href: '/admin/marketing', icon: Gift, label: 'Marketing' },
  { href: '/admin/settings', icon: Settings, label: 'Settings' },
];

/**
 * Admin Layout with dark mode and sidebar navigation
 * - Forces dark mode for kitchen displays
 * - Protects routes with useAdminAuth
 * - Sidebar navigation with active state
 */
export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, loading, isAuthorized } = useAdminAuth();
  const { signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
      <aside className="fixed left-0 top-0 h-full w-64 bg-gray-900 border-r border-gray-800 z-40">
        {/* Logo / Restaurant Name */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shrink-0">
              <Store className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-lg truncate">
                {user?.restaurantName || 'Mon Restaurant'}
              </h2>
              <p className="text-xs text-gray-400">Admin Dashboard</p>
            </div>          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                  ${
                    isActive
                      ? 'bg-orange-500/10 text-orange-500 font-medium'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer: User Info + Logout */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-800 bg-gray-900">
          {/* User Profile & Logout */}
          <div className="p-4 flex items-center justify-between">
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
          </div>

          {/* App Name */}
          <div className="px-4 pb-4 pt-2">
            <p className="text-xs text-gray-500 text-center font-medium">
              Powered by <span className="text-orange-500 font-semibold">SmartMenu</span>
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 min-h-screen bg-gray-950">
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
      </main>
    </div>
  );
}
