'use client';

import { useState, memo } from 'react';
import { Pencil, Trash2, Flame, Leaf, GripVertical } from 'lucide-react';
import type { Product } from '@/types/schema';
import { MenuService } from '@/lib/services/menu-service';
import { getProductImages, formatCurrency } from '@/lib/utils';
import ImageCarousel from './ImageCarousel';

interface AdminProductCardProps {
  product: Product;
  restaurantId: string;
  onEdit: (product: Product) => void;
  onDeleted?: () => void;
}

function AdminProductCardComponent({
  product,
  restaurantId,
  onEdit,
  onDeleted,
}: AdminProductCardProps) {
  // Optimistic UI: Track local availability state
  const [isAvailable, setIsAvailable] = useState(product.isAvailable);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleToggleAvailability = async () => {
    // Optimistic UI: Update immediately
    const newStatus = !isAvailable;
    setIsAvailable(newStatus);
    setIsTogglingStatus(true);

    try {
      await MenuService.updateProductStatus(restaurantId, product.id, newStatus);
    } catch (error) {
      // Rollback on error
      setIsAvailable(!newStatus);
      alert(error instanceof Error ? error.message : 'Erreur lors de la modification');
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const handleDelete = async () => {
    const confirm = window.confirm(
      `Supprimer "${product.name}" ?\n\nCette action est irréversible.`
    );
    if (!confirm) return;

    setIsDeleting(true);
    try {
      const images = getProductImages(product);
      if (images.length > 0) {
        await MenuService.deleteProductWithImages(restaurantId, product.id, images);
      } else {
        await MenuService.deleteProduct(restaurantId, product.id, product.image);
      }
      onDeleted?.();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erreur lors de la suppression');
      setIsDeleting(false);
    }
  };

  // Get product images (supports both legacy single image and new multi-images)
  const productImages = getProductImages(product);

  return (
    <div
      className={`
        bg-gradient-to-br from-gray-800 to-gray-900
        rounded-lg border border-gray-700
        overflow-hidden
        transition-all duration-300
        ${!isAvailable ? 'opacity-60' : 'opacity-100'}
        ${isDeleting ? 'scale-95 opacity-50' : 'hover:border-orange-500/50'}
      `}
    >
      <div className="flex items-center gap-4 p-4">
        {/* Drag Handle */}
        <div className="flex-shrink-0 cursor-grab active:cursor-grabbing hover:text-orange-500 transition-colors">
          <GripVertical className="w-5 h-5 text-gray-500 hover:text-orange-500 transition-colors" />
        </div>

        {/* Product Image Carousel - Fixed size for consistency */}
        <div className="w-24 h-24 flex-shrink-0">
          <ImageCarousel
            images={productImages}
            alt={product.name}
            className="w-full h-full aspect-square rounded-lg"
          />
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg text-white truncate">
            {product.name}
          </h3>
          <p className="text-sm text-gray-400 line-clamp-2 mb-2">
            {product.description || 'Pas de description'}
          </p>

          {/* AI Tags Badges */}
          {product.aiTags && product.aiTags.length > 0 && (
            <div className="flex items-center gap-1 mb-2 flex-wrap">
              {product.aiTags.map((tag) => {
                const tagLower = tag.toLowerCase();

                // Spicy badge
                if (tagLower.includes('épicé') || tagLower.includes('spicy') || tagLower.includes('piquant')) {
                  return (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 text-xs font-medium"
                    >
                      <Flame className="w-3 h-3" />
                      Épicé
                    </span>
                  );
                }

                // Vegan badge
                if (tagLower.includes('vegan') || tagLower.includes('végétalien') || tagLower.includes('vegetarien')) {
                  return (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-xs font-medium"
                    >
                      <Leaf className="w-3 h-3" />
                      Vegan
                    </span>
                  );
                }

                // Generic badge for other tags
                return (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-full bg-gray-700 text-gray-300 text-xs font-medium"
                  >
                    {tag}
                  </span>
                );
              })}
            </div>
          )}

          <p className="text-orange-500 font-bold text-lg">
            {formatCurrency(product.price)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col items-end gap-3 flex-shrink-0">
          {/* Availability Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-medium">
              {isAvailable ? 'Dispo' : 'Suspendu'}
            </span>
            <button
              onClick={handleToggleAvailability}
              disabled={isTogglingStatus || isDeleting}
              className={`
                relative w-12 h-6 rounded-full transition-all
                ${isAvailable ? 'bg-green-500' : 'bg-gray-600'}
                ${isTogglingStatus ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
              title={isAvailable ? 'Suspendre le produit' : 'Rendre disponible'}
            >
              <div
                className={`
                  absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md
                  transition-all duration-300
                  ${isAvailable ? 'right-0.5' : 'left-0.5'}
                `}
              />
            </button>
          </div>

          {/* Edit & Delete Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(product)}
              disabled={isDeleting}
              className="
                p-2 rounded-lg
                bg-blue-500/10 text-blue-500
                hover:bg-blue-500/20
                transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
              "
              title="Modifier le produit"
            >
              <Pencil className="w-4 h-4" />
            </button>

            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="
                p-2 rounded-lg
                bg-red-500/10 text-red-500
                hover:bg-red-500/20
                transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
              "
              title="Supprimer le produit"
            >
              {isDeleting ? (
                <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Export memoized version for performance optimization
// Prevents re-renders when parent re-renders but props haven't changed
const AdminProductCard = memo(AdminProductCardComponent);
export default AdminProductCard;
