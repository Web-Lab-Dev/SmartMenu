import {
  getDb,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from '@/lib/firebase';
import { withFirebaseErrorHandling } from '@/lib/firebase-helpers';
import { addProductFormSchema } from '@/lib/validation';
import { COLLECTIONS } from '@/lib/constants';
import type { ProductInput, AddProductFormInput } from '@/lib/validation';

/**
 * Product Service
 * Handles all product-related operations with validation
 */
export class ProductService {
  /**
   * Get all products for a restaurant
   *
   * @param restaurantId - Restaurant ID
   * @returns Array of products ordered by category and order field
   */
  static async getRestaurantProducts(
    restaurantId: string
  ): Promise<ProductInput[]> {
    return withFirebaseErrorHandling(async () => {
      const db = getDb();
      const productsCollection = collection(db, COLLECTIONS.PRODUCTS);

      const q = query(
        productsCollection,
        where('restaurantId', '==', restaurantId),
        orderBy('order', 'asc')
      );

      const snapshot = await getDocs(q);

      const products = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as ProductInput;
      });

      return products;
    });
  }

  /**
   * Get products by category
   *
   * @param restaurantId - Restaurant ID
   * @param categoryId - Category ID
   * @returns Array of products in the category
   */
  static async getProductsByCategory(
    restaurantId: string,
    categoryId: string
  ): Promise<ProductInput[]> {
    return withFirebaseErrorHandling(async () => {
      const db = getDb();
      const productsCollection = collection(db, COLLECTIONS.PRODUCTS);

      const q = query(
        productsCollection,
        where('restaurantId', '==', restaurantId),
        where('categoryId', '==', categoryId),
        where('isAvailable', '==', true),
        orderBy('order', 'asc')
      );

      const snapshot = await getDocs(q);

      const products = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as ProductInput;
      });

      return products;
    });
  }

  /**
   * Get a single product by ID
   *
   * @param productId - Product ID
   * @returns Product data or null if not found
   */
  static async getProductById(productId: string): Promise<ProductInput | null> {
    return withFirebaseErrorHandling(async () => {
      const db = getDb();
      const productRef = doc(db, COLLECTIONS.PRODUCTS, productId);
      const productDoc = await getDoc(productRef);

      if (!productDoc.exists()) {
        return null;
      }

      const data = productDoc.data();
      return {
        id: productDoc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as ProductInput;
    });
  }

  /**
   * Create a new product
   *
   * @param restaurantId - Restaurant ID
   * @param productData - Product form data
   * @returns Created product ID
   */
  static async createProduct(
    restaurantId: string,
    productData: AddProductFormInput
  ): Promise<{ productId: string }> {
    return withFirebaseErrorHandling(async () => {
      // Validate form data
      const validated = addProductFormSchema.parse(productData);

      // Get next order number for this category
      const db = getDb();
      const productsCollection = collection(db, COLLECTIONS.PRODUCTS);
      const q = query(
        productsCollection,
        where('restaurantId', '==', restaurantId),
        where('categoryId', '==', validated.categoryId)
      );
      const snapshot = await getDocs(q);
      const nextOrder = snapshot.size;

      // Prepare product document
      const productDoc = {
        restaurantId,
        categoryId: validated.categoryId,
        name: validated.name,
        description: validated.description,
        price: validated.price, // Already in cents from validation
        image: validated.image,
        preparationTime: validated.preparationTime,
        allergens: validated.allergens || [],
        aiTags: validated.aiTags || [],
        isAvailable: true,
        order: nextOrder,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Create product in Firestore
      const docRef = await addDoc(productsCollection, productDoc);

      console.log(`✓ Product created: ${docRef.id}`);
      return { productId: docRef.id };
    });
  }

  /**
   * Update a product
   *
   * @param productId - Product ID
   * @param productData - Partial product data to update
   */
  static async updateProduct(
    productId: string,
    productData: Partial<AddProductFormInput> & { isAvailable?: boolean }
  ): Promise<void> {
    return withFirebaseErrorHandling(async () => {
      const updateData: Record<string, unknown> = {
        ...productData,
        updatedAt: serverTimestamp(),
      };

      const db = getDb();
      const productRef = doc(db, COLLECTIONS.PRODUCTS, productId);
      await updateDoc(productRef, updateData);

      console.log(`✓ Product ${productId} updated`);
    });
  }

  /**
   * Toggle product availability
   *
   * @param productId - Product ID
   * @param isAvailable - New availability status
   */
  static async toggleAvailability(
    productId: string,
    isAvailable: boolean
  ): Promise<void> {
    return withFirebaseErrorHandling(async () => {
      const db = getDb();
      const productRef = doc(db, COLLECTIONS.PRODUCTS, productId);
      await updateDoc(productRef, {
        isAvailable,
        updatedAt: serverTimestamp(),
      });

      console.log(`✓ Product ${productId} availability: ${isAvailable}`);
    });
  }

  /**
   * Delete a product
   *
   * @param productId - Product ID
   */
  static async deleteProduct(productId: string): Promise<void> {
    return withFirebaseErrorHandling(async () => {
      const db = getDb();
      const productRef = doc(db, COLLECTIONS.PRODUCTS, productId);
      await deleteDoc(productRef);

      console.log(`✓ Product ${productId} deleted`);
    });
  }

  /**
   * Reorder products within a category
   *
   * @param productIds - Array of product IDs in the new order
   */
  static async reorderProducts(productIds: string[]): Promise<void> {
    return withFirebaseErrorHandling(async () => {
      const db = getDb();

      // Update each product's order field
      const updatePromises = productIds.map((productId, index) => {
        const productRef = doc(db, COLLECTIONS.PRODUCTS, productId);
        return updateDoc(productRef, {
          order: index,
          updatedAt: serverTimestamp(),
        });
      });

      await Promise.all(updatePromises);

      console.log(`✓ Reordered ${productIds.length} products`);
    });
  }
}
