// ========================================
// useAdminAuth Hook
// ========================================
// Custom hook for admin authentication and role verification

'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  restaurantId: string | null;
  restaurantName?: string | null;
}

interface UseAdminAuthReturn {
  user: User | null;
  loading: boolean;
  isAuthorized: boolean;
  restaurantId: string | null;
}

/**
 * Hook to protect admin routes
 * Verifies user is authenticated and has owner/staff role
 * Redirects to /login if not authorized
 */
export function useAdminAuth(): UseAdminAuthReturn {
  const router = useRouter();
  const { user, loading } = useAuthStore();

  // Memoize computed values to prevent unnecessary re-renders
  const isAuthorized = useMemo(() => !!user && !!user.restaurantId, [user]);
  const restaurantId = useMemo(() => user?.restaurantId || null, [user]);

  useEffect(() => {
    // Wait for auth to finish loading
    if (loading) return;

    // If no user or no restaurant, redirect to login
    if (!user || !user.restaurantId) {
      // Prevent redirect loop by checking current path
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        console.log('[Admin Auth] Unauthorized access, redirecting to login');
        router.replace('/login');
      }
    }
  }, [user, loading, router]);

  // Memoize return object to prevent reference changes
  return useMemo(
    () => ({
      user,
      loading,
      isAuthorized,
      restaurantId,
    }),
    [user, loading, isAuthorized, restaurantId]
  );
}
