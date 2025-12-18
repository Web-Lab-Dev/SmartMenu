import {
  getDb,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDocs,
  getDoc,
  serverTimestamp,
} from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/constants';
import { StorageService } from '@/services/StorageService';
import { getProductImages } from '@/lib/utils';

/**
 * Menu Service
 * Handles all menu management operations (categories & products)
 */
export class MenuService {
  /**
   * Add a new category
   */
  static async addCategory(
    restaurantId: string,
    name: string,
    order?: number
  ): Promise<{ categoryId: string }> {
    try {
      const db = getDb();
      const categoriesCollection = collection(db, COLLECTIONS.CATEGORIES);

      // If no order specified, get the count to add at the end
      if (order === undefined) {
        const q = query(categoriesCollection, where('restaurantId', '==', restaurantId));
        const snapshot = await getDocs(q);
        order = snapshot.size;
      }

      const categoryDoc = {
        restaurantId,
        name,
        order,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(categoriesCollection, categoryDoc);
      console.log(`✓ Category created: ${docRef.id}`);

      return { categoryId: docRef.id };
    } catch (error) {
      console.error('Error adding category:', error);
      throw new Error('Impossible de créer la catégorie');
    }
  }

  /**
   * Update/rename a category
   */
  static async updateCategory(
    restaurantId: string,
    categoryId: string,
    name: string
  ): Promise<void> {
    try {
      const db = getDb();
      const categoryRef = doc(db, COLLECTIONS.CATEGORIES, categoryId);

      await updateDoc(categoryRef, {
        name: name.trim(),
        updatedAt: serverTimestamp(),
      });

      console.log(`✓ Category updated: ${categoryId}`);
    } catch (error) {
      console.error('Error updating category:', error);
      throw new Error('Impossible de modifier la catégorie');
    }
  }

  /**
   * Delete a category (only if it has no products)
   */
  static async deleteCategory(
    restaurantId: string,
    categoryId: string
  ): Promise<void> {
    try {
      const db = getDb();

      // Check if category has products
      const productsQuery = query(
        collection(db, COLLECTIONS.PRODUCTS),
        where('restaurantId', '==', restaurantId),
        where('categoryId', '==', categoryId)
      );
      const productsSnapshot = await getDocs(productsQuery);

      if (!productsSnapshot.empty) {
        throw new Error('Impossible de supprimer une catégorie contenant des produits');
      }

      // Delete category
      const categoryRef = doc(db, COLLECTIONS.CATEGORIES, categoryId);
      await deleteDoc(categoryRef);

      console.log(`✓ Category deleted: ${categoryId}`);
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }

  /**
   * Add a new product with optional image upload
   * @deprecated Use addProductWithImages instead for multi-image support
   */
  static async addProduct(
    restaurantId: string,
    productData: {
      name: string;
      description: string;
      price: number;
      categoryId: string;
    },
    imageFile?: File
  ): Promise<{ productId: string }> {
    // Convert single image to array and use new method
    const imageFiles = imageFile ? [imageFile] : [];
    return this.addProductWithImages(restaurantId, productData, imageFiles);
  }

  /**
   * Update a product with optional image upload
   * @deprecated Use updateProductWithImages instead for multi-image support
   */
  static async updateProduct(
    restaurantId: string,
    productId: string,
    productData: {
      name: string;
      description: string;
      price: number;
      categoryId: string;
    },
    imageFile?: File,
    oldImageUrl?: string
  ): Promise<void> {
    // Convert single image to arrays and use new method
    const newImageFiles = imageFile ? [imageFile] : [];
    const existingImageUrls = oldImageUrl ? [oldImageUrl] : [];
    return this.updateProductWithImages(
      restaurantId,
      productId,
      productData,
      newImageFiles,
      existingImageUrls
    );
  }

  /**
   * Update product availability status (optimistic UI support)
   */
  static async updateProductStatus(
    restaurantId: string,
    productId: string,
    isAvailable: boolean
  ): Promise<void> {
    try {
      const db = getDb();
      const productRef = doc(db, COLLECTIONS.PRODUCTS, productId);

      await updateDoc(productRef, {
        isAvailable,
        updatedAt: serverTimestamp(),
      });

      console.log(`✓ Product ${productId} availability: ${isAvailable}`);
    } catch (error) {
      console.error('Error updating product status:', error);
      throw new Error('Impossible de modifier le statut du produit');
    }
  }

  /**
   * Delete a product and its image
   * @deprecated Use deleteProductWithImages instead for multi-image support
   */
  static async deleteProduct(
    restaurantId: string,
    productId: string,
    imageUrl?: string
  ): Promise<void> {
    // Convert single image to array and use new method
    const imageUrls = imageUrl ? [imageUrl] : [];
    return this.deleteProductWithImages(restaurantId, productId, imageUrls);
  }

  /**
   * Add a product with multiple images (NEW - supports up to 3 images)
   */
  static async addProductWithImages(
    restaurantId: string,
    productData: {
      name: string;
      description: string;
      price: number;
      categoryId: string;
    },
    imageFiles: File[]
  ): Promise<{ productId: string }> {
    try {
      const db = getDb();

      // Upload all images
      const imageUrls = await StorageService.uploadMultipleImages(
        restaurantId,
        imageFiles
      );

      // Create product document with images array
      const productsCollection = collection(db, COLLECTIONS.PRODUCTS);
      const productDoc = {
        restaurantId,
        name: productData.name,
        description: productData.description,
        price: productData.price,
        categoryId: productData.categoryId,
        images: imageUrls, // NEW: images array
        isAvailable: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(productsCollection, productDoc);
      console.log(`✓ Product created with ${imageUrls.length} images: ${docRef.id}`);

      return { productId: docRef.id };
    } catch (error) {
      console.error('Error adding product with images:', error);
      throw new Error('Impossible de créer le produit');
    }
  }

  /**
   * Update a product with multiple images
   */
  static async updateProductWithImages(
    restaurantId: string,
    productId: string,
    productData: {
      name: string;
      description: string;
      price: number;
      categoryId: string;
    },
    newImageFiles: File[],
    existingImageUrls: string[]
  ): Promise<void> {
    try {
      const db = getDb();

      // Get current product to find old images that need to be deleted
      const productRef = doc(db, COLLECTIONS.PRODUCTS, productId);
      const productDoc = await getDoc(productRef);
      const currentProduct = productDoc.data();
      const currentImages = getProductImages(currentProduct as any);

      // Upload new images if provided
      const newImageUrls = newImageFiles.length > 0
        ? await StorageService.uploadMultipleImages(restaurantId, newImageFiles)
        : [];

      // Combine kept existing images and new images (max 3 total)
      const allImages = [...existingImageUrls, ...newImageUrls].slice(0, 3);

      // Delete old images that are no longer used
      const imagesToDelete = currentImages.filter(img => !allImages.includes(img));
      if (imagesToDelete.length > 0) {
        await StorageService.deleteMultipleImages(imagesToDelete);
      }

      // Update product document
      const updateData: Record<string, unknown> = {
        name: productData.name,
        description: productData.description,
        price: productData.price,
        categoryId: productData.categoryId,
        images: allImages,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(productRef, updateData);
      console.log(`✓ Product updated: ${productId}, deleted ${imagesToDelete.length} old images`);
    } catch (error) {
      console.error('Error updating product:', error);
      throw new Error('Impossible de modifier le produit');
    }
  }

  /**
   * Delete a product with multiple images
   */
  static async deleteProductWithImages(
    restaurantId: string,
    productId: string,
    imageUrls: string[]
  ): Promise<void> {
    try {
      console.log(`🗑️ Starting deletion of product ${productId} with ${imageUrls.length} images`);
      const db = getDb();

      // Delete all images
      if (imageUrls && imageUrls.length > 0) {
        console.log(`📸 Deleting ${imageUrls.length} images from storage...`);
        await StorageService.deleteMultipleImages(imageUrls);
        console.log(`✓ Images deleted successfully`);
      }

      // Delete product document
      console.log(`📄 Deleting product document from Firestore...`);
      const productRef = doc(db, COLLECTIONS.PRODUCTS, productId);
      await deleteDoc(productRef);

      console.log(`✅ Product deleted successfully: ${productId}`);
    } catch (error) {
      console.error('❌ Error deleting product:', error);
      throw new Error('Impossible de supprimer le produit');
    }
  }

  /**
   * Batch update product order (for drag-and-drop reordering)
   */
  static async updateProductsOrder(
    restaurantId: string,
    updates: Array<{ productId: string; order: number }>
  ): Promise<void> {
    try {
      const db = getDb();

      // Batch update for performance
      const updatePromises = updates.map(({ productId, order }) => {
        const productRef = doc(db, COLLECTIONS.PRODUCTS, productId);
        return updateDoc(productRef, {
          order,
          updatedAt: serverTimestamp(),
        });
      });

      await Promise.all(updatePromises);
      console.log(`✓ ${updates.length} products reordered`);
    } catch (error) {
      console.error('Error updating products order:', error);
      throw new Error('Impossible de réorganiser les produits');
    }
  }
}
