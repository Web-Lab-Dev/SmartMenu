// ========================================
// Feedback Service
// ========================================
// Handles customer feedback and ratings (Module 4)

import { getDb } from '@/lib/firebase';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  limit as firestoreLimit,
} from 'firebase/firestore';
import { COLLECTIONS } from '@/lib/constants';
import type { Feedback } from '@/types/schema';

export class FeedbackService {
  /**
   * Submit customer feedback
   * @param data - Feedback data
   * @returns Created feedback document ID
   */
  static async submitFeedback(data: {
    restaurantId: string;
    orderId: string;
    customerSessionId: string;
    rating: number;
    message?: string;
  }): Promise<string> {
    try {
      // Validation
      if (data.rating < 1 || data.rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }

      // Only save message for low ratings (3 or less)
      const feedbackData = {
        restaurantId: data.restaurantId,
        orderId: data.orderId,
        customerSessionId: data.customerSessionId,
        rating: data.rating,
        message: data.rating <= 3 ? data.message : undefined,
        createdAt: Timestamp.now(),
      };

      const db = getDb();
      const feedbackRef = collection(db, COLLECTIONS.FEEDBACK);
      const docRef = await addDoc(feedbackRef, feedbackData);

      console.log('[Feedback] Created feedback:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('[Feedback] Failed to submit feedback:', error);
      throw error;
    }
  }

  /**
   * Get all feedback for a restaurant
   * @param restaurantId - Restaurant ID
   * @param limitCount - Maximum number of feedback to retrieve
   * @returns Array of feedback
   */
  static async getRestaurantFeedback(
    restaurantId: string,
    limitCount: number = 50
  ): Promise<Feedback[]> {
    try {
      const db = getDb();
      const feedbackRef = collection(db, COLLECTIONS.FEEDBACK);
      const q = query(
        feedbackRef,
        where('restaurantId', '==', restaurantId),
        orderBy('createdAt', 'desc'),
        firestoreLimit(limitCount)
      );

      const snapshot = await getDocs(q);
      const feedback: Feedback[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          restaurantId: data.restaurantId,
          orderId: data.orderId,
          customerSessionId: data.customerSessionId,
          rating: data.rating,
          message: data.message,
          createdAt: data.createdAt?.toDate() || new Date(),
        };
      });

      return feedback;
    } catch (error) {
      console.error('[Feedback] Failed to get feedback:', error);
      throw error;
    }
  }

  /**
   * Get negative feedback only (rating <= 3) for admin dashboard
   * @param restaurantId - Restaurant ID
   * @param limitCount - Maximum number of feedback to retrieve
   * @returns Array of negative feedback
   */
  static async getNegativeFeedback(
    restaurantId: string,
    limitCount: number = 50
  ): Promise<Feedback[]> {
    try {
      const db = getDb();
      const feedbackRef = collection(db, COLLECTIONS.FEEDBACK);
      const q = query(
        feedbackRef,
        where('restaurantId', '==', restaurantId),
        where('rating', '<=', 3),
        orderBy('rating', 'asc'),
        orderBy('createdAt', 'desc'),
        firestoreLimit(limitCount)
      );

      const snapshot = await getDocs(q);
      const feedback: Feedback[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          restaurantId: data.restaurantId,
          orderId: data.orderId,
          customerSessionId: data.customerSessionId,
          rating: data.rating,
          message: data.message,
          createdAt: data.createdAt?.toDate() || new Date(),
        };
      });

      return feedback;
    } catch (error) {
      console.error('[Feedback] Failed to get negative feedback:', error);
      throw error;
    }
  }

  /**
   * Get feedback statistics for a restaurant
   * @param restaurantId - Restaurant ID
   * @returns Feedback stats
   */
  static async getFeedbackStats(restaurantId: string): Promise<{
    total: number;
    average: number;
    distribution: Record<number, number>; // {1: count, 2: count, ...}
  }> {
    try {
      const db = getDb();
      const feedbackRef = collection(db, COLLECTIONS.FEEDBACK);
      const q = query(feedbackRef, where('restaurantId', '==', restaurantId));

      const snapshot = await getDocs(q);
      const feedbackData = snapshot.docs.map((doc) => doc.data());

      const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      let totalRating = 0;

      feedbackData.forEach((feedback) => {
        const rating = feedback.rating;
        distribution[rating] = (distribution[rating] || 0) + 1;
        totalRating += rating;
      });

      const total = feedbackData.length;
      const average = total > 0 ? totalRating / total : 0;

      return {
        total,
        average,
        distribution,
      };
    } catch (error) {
      console.error('[Feedback] Failed to get stats:', error);
      throw error;
    }
  }
}
