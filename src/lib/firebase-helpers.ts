// ========================================
// Firebase Helper Functions
// ========================================

import type { Timestamp as FirebaseTimestamp } from 'firebase/firestore';

/**
 * Convert Firebase Timestamp to JavaScript Date
 */
export function convertFirestoreTimestamp(
  timestamp: FirebaseTimestamp | Date | undefined
): Date {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;
  if ('toDate' in timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  return new Date();
}

/**
 * Safe error handling wrapper for Firebase operations
 */
export async function withFirebaseErrorHandling<T>(
  operation: () => Promise<T>,
  errorMessage?: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.error('[Firebase Error]', errorMessage || 'Operation failed:', error);
    if (error instanceof Error) {
      throw new Error(errorMessage ? `${errorMessage}: ${error.message}` : error.message);
    }
    throw error;
  }
}

/**
 * Handle Firebase error (log and optionally notify user)
 */
export function handleFirebaseError(error: unknown): void {
  console.error('[Firebase Error]', error);

  if (error instanceof Error) {
    const message = error.message;

    // Log specific error types
    if (message.includes('permission-denied')) {
      console.error('Permission denied - check Firebase rules');
    } else if (message.includes('not-found')) {
      console.error('Document not found');
    } else if (message.includes('network')) {
      console.error('Network error - check connection');
    }
  }
}
