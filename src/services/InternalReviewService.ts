import {
  getDb,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/constants';

export interface InternalReview {
  id: string;
  restaurantId: string;
  tableId: string;
  rating: number; // 1-5
  comment: string;
  email?: string;
  isRead: boolean;
  createdAt: Date;
}


/**
 * InternalReviewService - Gestion des avis internes (feedback négatif)
 */
export class InternalReviewService {
  /**
   * Créer un avis interne
   */
  static async createReview(data: {
    restaurantId: string;
    tableId: string;
    rating: number;
    comment: string;
    email?: string;
  }): Promise<{ reviewId: string }> {
    try {
      const db = getDb();
      const reviewsRef = collection(db, COLLECTIONS.INTERNAL_REVIEWS || 'internal_reviews');

      const reviewDoc = {
        restaurantId: data.restaurantId,
        tableId: data.tableId,
        rating: data.rating,
        comment: data.comment,
        email: data.email || null,
        isRead: false,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(reviewsRef, reviewDoc);
      console.log('[InternalReviewService] ✓ Review created:', docRef.id);

      return { reviewId: docRef.id };
    } catch (error) {
      console.error('[InternalReviewService] Error creating review:', error);
      throw new Error('Impossible de créer l\'avis');
    }
  }

  /**
   * Récupérer tous les avis d'un restaurant
   */
  static async getRestaurantReviews(restaurantId: string): Promise<InternalReview[]> {
    try {
      const db = getDb();
      const reviewsRef = collection(db, COLLECTIONS.INTERNAL_REVIEWS || 'internal_reviews');

      const q = query(
        reviewsRef,
        where('restaurantId', '==', restaurantId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);

      const reviews = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          restaurantId: data.restaurantId,
          tableId: data.tableId,
          rating: data.rating,
          comment: data.comment,
          email: data.email || undefined,
          isRead: data.isRead || false,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as InternalReview;
      });

      return reviews;
    } catch (error) {
      console.error('[InternalReviewService] Error getting reviews:', error);
      throw new Error('Impossible de récupérer les avis');
    }
  }

  /**
   * Marquer un avis comme lu
   */
  static async markAsRead(reviewId: string): Promise<void> {
    try {
      const db = getDb();
      const reviewRef = doc(db, COLLECTIONS.INTERNAL_REVIEWS || 'internal_reviews', reviewId);

      await updateDoc(reviewRef, {
        isRead: true,
      });

      console.log('[InternalReviewService] ✓ Review marked as read:', reviewId);
    } catch (error) {
      console.error('[InternalReviewService] Error marking as read:', error);
      throw new Error('Impossible de marquer comme lu');
    }
  }

  /**
   * Compter les avis non lus
   */
  static async getUnreadCount(restaurantId: string): Promise<number> {
    try {
      const db = getDb();
      const reviewsRef = collection(db, COLLECTIONS.INTERNAL_REVIEWS || 'internal_reviews');

      const q = query(
        reviewsRef,
        where('restaurantId', '==', restaurantId),
        where('isRead', '==', false)
      );

      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('[InternalReviewService] Error counting unread:', error);
      return 0;
    }
  }
}
