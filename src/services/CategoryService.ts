import {
  getDb,
  collection,
  query,
  where,
  orderBy,
  getDocs,
} from '@/lib/firebase';
import { withFirebaseErrorHandling } from '@/lib/firebase-helpers';
import { COLLECTIONS } from '@/lib/constants';
import type { Category } from '@/types/schema';

/**
 * Category Service
 * Handles all category-related operations
 */
export class CategoryService {
  /**
   * Get all categories for a restaurant
   */
  static async getRestaurantCategories(
    restaurantId: string
  ): Promise<Category[]> {
    return withFirebaseErrorHandling(async () => {
      const db = getDb();
      const categoriesCollection = collection(db, COLLECTIONS.CATEGORIES);

      const q = query(
        categoriesCollection,
        where('restaurantId', '==', restaurantId),
        where('isActive', '==', true),
        orderBy('displayOrder', 'asc')
      );

      const snapshot = await getDocs(q);

      const categories = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          restaurantId: data.restaurantId,
          name: data.name,
          order: data.order,
          icon: data.icon,
          isAvailable: data.isAvailable !== false,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Category;
      });

      return categories;
    });
  }
}
