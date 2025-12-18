'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Sparkles } from 'lucide-react';
import type { Product, Category } from '@/types/schema';
import { MenuService } from '@/lib/services/menu-service';
import { MENU_TEMPLATES, type MenuTemplate } from '@/data/menu-templates';
import { getProductImages } from '@/lib/utils';
import MultiImageUploader from './MultiImageUploader';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantId: string;
  categories: Category[];
  product?: Product | null;
  onSuccess?: () => void;
}

export default function ProductFormModal({
  isOpen,
  onClose,
  restaurantId,
  categories,
  product,
  onSuccess,
}: ProductFormModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!product;

  // Initialize form when product changes
  useEffect(() => {
    if (product) {
      setName(product.name);
      setDescription(product.description || '');
      setPrice(product.price.toString());
      setCategoryId(product.categoryId);
      setExistingImages(getProductImages(product));
      setImageFiles([]);
    } else {
      resetForm();
    }
  }, [product]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setPrice('');
    setCategoryId(categories[0]?.id || '');
    setImageFiles([]);
    setExistingImages([]);
  };

  const handleTemplateSelect = (template: MenuTemplate) => {
    setName(template.name);
    setDescription(template.description);
    setPrice((template.suggestedPrice / 100).toString());

    const matchingCategory = categories.find(
      (cat) => cat.name.toLowerCase() === template.category.toLowerCase()
    );
    setCategoryId(matchingCategory?.id || categories[0]?.id || '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Le nom est requis');
      return;
    }
    if (!categoryId) {
      alert('Veuillez sélectionner une catégorie');
      return;
    }
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      alert('Prix invalide');
      return;
    }

    setIsSubmitting(true);

    try {
      const productData = {
        name: name.trim(),
        description: description.trim(),
        price: priceNum * 100, // Convert to cents
        categoryId,
      };

      if (isEditMode && product) {
        // Edit mode: Update product with multi-images
        await MenuService.updateProductWithImages(
          restaurantId,
          product.id,
          productData,
          imageFiles,
          existingImages
        );
      } else {
        // Create mode: Add product with multi-images
        if (imageFiles.length > 0) {
          await MenuService.addProductWithImages(
            restaurantId,
            productData,
            imageFiles
          );
        } else {
          // Fallback to single image for backward compatibility
          await MenuService.addProduct(restaurantId, productData);
        }
      }

      onSuccess?.();
      onClose();
      resetForm();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      resetForm();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">
            {isEditMode ? 'Modifier le produit' : 'Ajouter un produit'}
          </h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Smart Templates (Only in create mode) */}
          {!isEditMode && (
            <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-orange-500" />
                <h3 className="font-semibold text-white">Suggestions Rapides</h3>
              </div>
              <p className="text-sm text-gray-400 mb-3">
                Gagnez du temps en important un modèle pré-rempli
              </p>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {MENU_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => handleTemplateSelect(template)}
                    className="px-3 py-1.5 rounded-full text-sm font-medium bg-gray-800 text-gray-300 hover:bg-orange-500 hover:text-white border border-gray-600 hover:border-orange-500 transition-all"
                    title={template.description}
                  >
                    {template.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Multi-Image Upload */}
          <MultiImageUploader
            maxImages={3}
            onImagesChange={setImageFiles}
            existingImages={existingImages}
          />

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
              Nom du produit <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Poulet Yassa"
              required
              className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white placeholder-gray-500 border border-gray-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez votre produit..."
              rows={4}
              className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white placeholder-gray-500 border border-gray-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all resize-none"
            />
          </div>

          {/* Price & Category Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-300 mb-2">
                Prix (FCFA) <span className="text-red-500">*</span>
              </label>
              <input
                id="price"
                type="number"
                step="1"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="3500"
                required
                className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white placeholder-gray-500 border border-gray-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-2">
                Catégorie <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
              >
                <option value="">-- Sélectionner --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-6 py-3 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>Enregistrer</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
