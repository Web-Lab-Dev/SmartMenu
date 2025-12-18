'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  getDb,
  collection,
  query,
  onSnapshot,
  type QueryConstraint,
  type DocumentData,
  type Unsubscribe,
} from '@/lib/firebase';
import { handleFirebaseError } from '@/lib/firebase-helpers';

/**
 * Hook state for Firestore queries
 */
interface FirestoreState<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
}

/**
 * Real-time Firestore collection subscription hook
 *
 * @param collectionName - Firestore collection path
 * @param queryConstraints - Optional Firestore query constraints (where, orderBy, limit, etc.)
 * @param transform - Optional function to transform document data
 *
 * @returns Object with data, loading state, and error
 *
 * @example
 * ```tsx
 * const { data: orders, loading, error } = useFirestore<Order>(
 *   'orders',
 *   [where('restaurantId', '==', restaurantId), orderBy('createdAt', 'desc')],
 *   (doc) => ({ ...doc, createdAt: doc.createdAt.toDate() })
 * );
 * ```
 */
export function useFirestore<T extends DocumentData>(
  collectionName: string,
  queryConstraints: QueryConstraint[] = [],
  transform?: (data: DocumentData) => T
) {
  const [state, setState] = useState<FirestoreState<T>>({
    data: [],
    loading: true,
    error: null,
  });

  // Serialize query constraints to avoid unnecessary re-renders
  const serializedConstraints = JSON.stringify(queryConstraints);

  useEffect(() => {
    let unsubscribe: Unsubscribe | null = null;
    let mounted = true;

    const subscribeToCollection = () => {
      try {
        const db = getDb();
        const collectionRef = collection(db, collectionName);
        const constraints = JSON.parse(serializedConstraints) as QueryConstraint[];
        const q = query(collectionRef, ...constraints);

        unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            if (!mounted) return;

            const documents = snapshot.docs.map((doc) => {
              const data = { id: doc.id, ...doc.data() };
              return transform ? transform(data) : (data as unknown as T);
            });

            setState({
              data: documents,
              loading: false,
              error: null,
            });
          },
          (error) => {
            if (!mounted) return;
            console.error(`Firestore subscription error (${collectionName}):`, error);
            handleFirebaseError(error);
            setState({
              data: [],
              loading: false,
              error: error as Error,
            });
          }
        );
      } catch (error) {
        if (!mounted) return;
        console.error(`Failed to subscribe to ${collectionName}:`, error);
        handleFirebaseError(error);
        setState({
          data: [],
          loading: false,
          error: error as Error,
        });
      }
    };

    subscribeToCollection();

    // Cleanup subscription on unmount or when dependencies change
    return () => {
      mounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [collectionName, serializedConstraints, transform]);

  return state;
}

/**
 * Hook for retrying failed operations
 *
 * @returns retry function that can be called to retry the operation
 *
 * @example
 * ```tsx
 * const { data, loading, error } = useFirestore(...);
 * const retry = useRetry(() => {
 *   // Retry logic
 * });
 *
 * if (error) {
 *   return <button onClick={retry}>Réessayer</button>;
 * }
 * ```
 */
export function useRetry(operation: () => void | Promise<void>) {
  const [isRetrying, setIsRetrying] = useState(false);

  const retry = useCallback(async () => {
    setIsRetrying(true);
    try {
      await operation();
    } catch (error) {
      console.error('Retry failed:', error);
      handleFirebaseError(error);
    } finally {
      setIsRetrying(false);
    }
  }, [operation]);

  return { retry, isRetrying };
}
