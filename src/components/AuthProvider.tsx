'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { getAuthInstance, onAuthStateChanged } from '@/lib/firebase';
import { handleFirebaseError } from '@/lib/firebase-helpers';

/**
 * Authentication Provider
 * Manages Firebase auth state and syncs with Zustand store
 *
 * Features:
 * - Subscribes to Firebase auth state changes
 * - Updates global auth store
 * - Shows loading state during initialization
 * - Handles auth errors gracefully
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let mounted = true;

    const initAuth = () => {
      try {
        const auth = getAuthInstance();

        // Subscribe to auth state changes
        unsubscribe = onAuthStateChanged(
          auth,
          (firebaseUser) => {
            if (!mounted) return;

            if (firebaseUser) {
              // User is signed in
              setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                restaurantId: null, // Will be fetched from Firestore
              });
            } else {
              // User is signed out
              setUser(null);
            }
          },
          (error) => {
            if (!mounted) return;
            console.error('Auth state change error:', error);
            handleFirebaseError(error);
            setLoading(false);
          }
        );
      } catch (error) {
        if (!mounted) return;
        console.error('Failed to initialize auth listener:', error);
        handleFirebaseError(error);
        setLoading(false);
      }
    };

    initAuth();

    // Cleanup subscription on unmount
    return () => {
      mounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [setUser, setLoading]);

  // PERF: Don't block the entire app with a spinner
  // Let each protected route handle its own loading state
  return <>{children}</>;
}
