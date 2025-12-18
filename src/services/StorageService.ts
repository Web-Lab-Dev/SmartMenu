// ========================================
// Storage Service
// ========================================
// Handles Firebase Storage operations for images

import { getStorageInstance } from '@/lib/firebase';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  uploadBytesResumable,
  UploadTask,
} from 'firebase/storage';

/**
 * Storage Service for managing product images and restaurant branding
 */
export class StorageService {
  /**
   * Upload a product image
   * @param restaurantId - Restaurant ID
   * @param productId - Product ID
   * @param file - Image file to upload
   * @param onProgress - Optional progress callback
   * @returns Download URL of uploaded image
   */
  static async uploadProductImage(
    restaurantId: string,
    productId: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Le fichier doit être une image');
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error("L'image ne doit pas dépasser 5 Mo");
      }

      // Generate unique filename
      const timestamp = Date.now();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${timestamp}_${sanitizedFileName}`;

      // Create storage reference
      const storage = getStorageInstance();
      const storageRef = ref(
        storage,
        `restaurants/${restaurantId}/products/${productId}/${fileName}`
      );

      // Upload with progress tracking if callback provided
      if (onProgress) {
        const uploadTask: UploadTask = uploadBytesResumable(storageRef, file);

        return new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              onProgress(progress);
            },
            (error) => {
              console.error('[Storage] Upload error:', error);
              reject(error);
            },
            async () => {
              try {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                resolve(downloadURL);
              } catch (error) {
                reject(error);
              }
            }
          );
        });
      } else {
        // Simple upload without progress
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
      }
    } catch (error) {
      console.error('[Storage] Failed to upload image:', error);
      throw error;
    }
  }

  /**
   * Delete a product image
   * @param imageUrl - Full Firebase Storage URL of the image
   */
  static async deleteProductImage(imageUrl: string): Promise<void> {
    try {
      // Validate URL before attempting deletion
      if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim() === '') {
        console.warn('[Storage] Skipping deletion of empty/invalid URL');
        return;
      }

      // Check if it's a valid Firebase Storage URL
      if (!imageUrl.includes('firebasestorage.googleapis.com')) {
        console.warn('[Storage] Skipping deletion of non-Firebase URL:', imageUrl);
        return;
      }

      // Extract path from URL
      const url = new URL(imageUrl);
      const pathMatch = url.pathname.match(/\/o\/(.+)\?/);

      if (!pathMatch) {
        console.warn('[Storage] Invalid Firebase Storage URL format:', imageUrl);
        return;
      }

      const path = decodeURIComponent(pathMatch[1] || '');
      const storage = getStorageInstance();
      const imageRef = ref(storage, path);

      await deleteObject(imageRef);
      console.log('[Storage] Image deleted successfully:', path);
    } catch (error) {
      console.error('[Storage] Failed to delete image:', error);
      // Don't throw - log warning instead to allow deletion to continue
      console.warn('[Storage] Continuing deletion despite error for URL:', imageUrl);
    }
  }

  /**
   * Upload multiple product images
   * @param restaurantId - Restaurant ID
   * @param files - Array of image files to upload
   * @returns Array of download URLs
   */
  static async uploadMultipleImages(
    restaurantId: string,
    files: File[]
  ): Promise<string[]> {
    const productId = Date.now().toString(); // Temporary ID for batch upload
    const uploadPromises = files.map((file) =>
      this.uploadProductImage(restaurantId, productId, file)
    );
    return Promise.all(uploadPromises);
  }

  /**
   * Delete multiple product images
   * @param imageUrls - Array of Firebase Storage URLs to delete
   */
  static async deleteMultipleImages(imageUrls: string[]): Promise<void> {
    const deletePromises = imageUrls.map((url) => this.deleteProductImage(url));
    await Promise.all(deletePromises);
  }

  /**
   * Validate image file before upload
   * @param file - File to validate
   * @returns Validation result
   */
  static validateImageFile(file: File): { valid: boolean; error?: string } {
    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      return { valid: false, error: 'Le fichier doit être une image' };
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return { valid: false, error: "L'image ne doit pas dépasser 5 Mo" };
    }

    // Check allowed formats
    const allowedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedFormats.includes(file.type)) {
      return {
        valid: false,
        error: 'Format non supporté. Utilisez JPG, PNG ou WebP',
      };
    }

    return { valid: true };
  }
}
