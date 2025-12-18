import { doc, getDoc, query, collection, where, getDocs, limit } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/constants';
import type { Restaurant } from '@/types/schema';

/**
 * Restaurant Service
 * Handles restaurant data fetching and management
 */
export class RestaurantService {
  /**
   * Get restaurant by ID
   */
  static async getById(restaurantId: string): Promise<Restaurant | null> {
    try {
      const db = getDb();
      const restaurantRef = doc(db, COLLECTIONS.RESTAURANTS, restaurantId);
      const restaurantSnap = await getDoc(restaurantRef);

      if (!restaurantSnap.exists()) {
        console.warn(`Restaurant not found: ${restaurantId}`);
        return null;
      }

      return {
        id: restaurantSnap.id,
        ...restaurantSnap.data(),
      } as Restaurant;
    } catch (error) {
      console.error('Error fetching restaurant by ID:', error);
      throw new Error('Impossible de récupérer les données du restaurant');
    }
  }

  /**
   * Get restaurant by slug (URL-friendly identifier)
   */
  static async getBySlug(slug: string): Promise<Restaurant | null> {
    try {
      const db = getDb();
      const restaurantsQuery = query(
        collection(db, COLLECTIONS.RESTAURANTS),
        where('slug', '==', slug),
        limit(1)
      );

      const querySnapshot = await getDocs(restaurantsQuery);

      if (querySnapshot.empty) {
        console.warn(`Restaurant not found with slug: ${slug}`);
        return null;
      }

      const restaurantDoc = querySnapshot.docs[0];
      return {
        id: restaurantDoc.id,
        ...restaurantDoc.data(),
      } as Restaurant;
    } catch (error) {
      console.error('Error fetching restaurant by slug:', error);
      throw new Error('Impossible de récupérer les données du restaurant');
    }
  }

  /**
   * Check if restaurant exists
   */
  static async exists(restaurantId: string): Promise<boolean> {
    try {
      const restaurant = await this.getById(restaurantId);
      return restaurant !== null;
    } catch (error) {
      console.error('Error checking restaurant existence:', error);
      return false;
    }
  }
}
