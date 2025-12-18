// ========================================
// useAuth Hook
// ========================================
// Custom hook for Firebase authentication
// Provides: user, loading, error, signIn, signOut, signUp

'use client';

import { useEffect, useState } from 'react';
import {
  getAuthInstance,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from '@/lib/firebase';
import { getDb, doc, getDoc, setDoc, Timestamp } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/constants';
import { useAuthStore } from '@/lib/store';

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  restaurantId: string | null;
  restaurantName?: string | null;
}

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (
    email: string,
    password: string,
    restaurantName: string,
    ownerName: string
  ) => Promise<void>;
}

/**
 * Custom hook for authentication
 * - Listens to onAuthStateChanged
 * - Returns user, loading, error states
 * - Provides signIn, signOut, signUp functions
 * - Automatically fetches restaurantId from Firestore
 * - Creates restaurant profile on signup
 */
export function useAuth(): UseAuthReturn {
  const { user, setUser, setLoading, logout } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const loading = useAuthStore((state) => state.loading);

  // Listen to auth state changes
  useEffect(() => {
    let mounted = true;
    const auth = getAuthInstance();

    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser: FirebaseUser | null) => {
        if (!mounted) return;

        try {
          if (firebaseUser) {
            // User is signed in
            // Fetch restaurant data from Firestore
            const { restaurantId, restaurantName } = await fetchRestaurantData(firebaseUser.uid);

            const userData: User = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              restaurantId,
              restaurantName,
            };

            setUser(userData);
          } else {
            // User is signed out
            setUser(null);
          }
        } catch (err) {
          console.error('[useAuth] Error in auth state listener:', err);
          setError(err instanceof Error ? err.message : 'Authentication error');
          setLoading(false);
        }
      },
      (err) => {
        if (!mounted) return;
        console.error('[useAuth] Auth state change error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [setUser, setLoading]);

  /**
   * Fetch restaurant data from Firestore
   * Returns both restaurantId and restaurant name
   */
  const fetchRestaurantData = async (
    uid: string
  ): Promise<{ restaurantId: string | null; restaurantName: string | null }> => {
    try {
      const db = getDb();
      const userDocRef = doc(db, COLLECTIONS.USERS, uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const data = userDoc.data();
        const restaurantId = data.restaurantId || null;

        if (restaurantId) {
          // Fetch restaurant name
          const restaurantDocRef = doc(db, COLLECTIONS.RESTAURANTS, restaurantId);
          const restaurantDoc = await getDoc(restaurantDocRef);

          if (restaurantDoc.exists()) {
            const restaurantData = restaurantDoc.data();
            return {
              restaurantId,
              restaurantName: restaurantData.name || null,
            };
          }
        }

        return { restaurantId, restaurantName: null };
      }

      return { restaurantId: null, restaurantName: null };
    } catch (err) {
      console.error('[useAuth] Error fetching restaurant data:', err);
      return { restaurantId: null, restaurantName: null };
    }
  };

  /**
   * Sign in with email and password
   */
  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      setError(null);
      setLoading(true);
      const auth = getAuthInstance();
      await signInWithEmailAndPassword(auth, email, password);
      // User state will be updated by onAuthStateChanged listener
    } catch (err) {
      console.error('[useAuth] Sign in error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sign up with email and password
   * Automatically creates restaurant profile with real data
   */
  const signUp = async (
    email: string,
    password: string,
    restaurantName: string,
    ownerName: string
  ): Promise<void> => {
    try {
      setError(null);
      setLoading(true);
      const auth = getAuthInstance();
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Create restaurant profile automatically with real data
      await createRestaurantProfile(firebaseUser.uid, email, restaurantName, ownerName);

      // User state will be updated by onAuthStateChanged listener
    } catch (err) {
      console.error('[useAuth] Sign up error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign up';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Create restaurant profile in Firestore after signup
   * This is CRUCIAL - every new user needs a restaurant
   */
  const createRestaurantProfile = async (
    uid: string,
    email: string,
    restaurantName: string,
    ownerName: string
  ): Promise<void> => {
    try {
      const db = getDb();

      // Import slugify dynamically
      const { slugify } = await import('@/lib/utils');
      const slug = slugify(restaurantName);

      // Create restaurant document (ID = user UID)
      const restaurantRef = doc(db, COLLECTIONS.RESTAURANTS, uid);
      await setDoc(restaurantRef, {
        ownerId: uid,
        name: restaurantName,
        ownerName: ownerName,
        slug: slug,
        email: email,
        currency: 'EUR',
        isActive: true,
        branding: {
          primaryColor: '#FF4500',
          logo: '',
        },
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      // Create user document linking to restaurant
      const userRef = doc(db, COLLECTIONS.USERS, uid);
      await setDoc(userRef, {
        uid: uid,
        email: email,
        displayName: ownerName,
        restaurantId: uid, // Restaurant ID = User ID
        role: 'owner',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      console.log('[useAuth] Restaurant profile created successfully for user:', uid);
    } catch (err) {
      console.error('[useAuth] Error creating restaurant profile:', err);
      throw new Error('Failed to create restaurant profile');
    }
  };

  /**
   * Sign out
   */
  const signOut = async (): Promise<void> => {
    try {
      setError(null);
      setLoading(true);
      const auth = getAuthInstance();
      await firebaseSignOut(auth);
      logout();
    } catch (err) {
      console.error('[useAuth] Sign out error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign out';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    signIn,
    signOut,
    signUp,
  };
}
