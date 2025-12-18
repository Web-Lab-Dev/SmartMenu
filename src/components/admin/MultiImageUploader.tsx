'use client';

import { useState } from 'react';
import { Upload, X } from 'lucide-react';
import Image from 'next/image';

interface MultiImageUploaderProps {
  maxImages?: number;
  onImagesChange: (files: File[]) => void;
  existingImages?: string[]; // For edit mode
}

export default function MultiImageUploader({
  maxImages = 3,
  onImagesChange,
  existingImages = [],
}: MultiImageUploaderProps) {
  const [imagePreviews, setImagePreviews] = useState<string[]>(existingImages);
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Calculate how many more images we can add
    const remainingSlots = maxImages - imagePreviews.length;
    const filesToAdd = files.slice(0, remainingSlots);

    // Validate each file
    const validFiles: File[] = [];
    const newPreviews: string[] = [];

    filesToAdd.forEach((file) => {
      // Check file type
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} n'est pas une image`);
        return;
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} est trop volumineux (max 5MB)`);
        return;
      }

      validFiles.push(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result as string);
        if (newPreviews.length === validFiles.length) {
          setImagePreviews((prev) => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });

    const updatedFiles = [...imageFiles, ...validFiles];
    setImageFiles(updatedFiles);
    onImagesChange(updatedFiles);

    // Reset input
    e.target.value = '';
  };

  const handleRemoveImage = (index: number) => {
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    const newFiles = imageFiles.filter((_, i) => i !== index);

    setImagePreviews(newPreviews);
    setImageFiles(newFiles);
    onImagesChange(newFiles);
  };

  const canAddMore = imagePreviews.length < maxImages;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Images du produit (max {maxImages})
      </label>

      <div className="grid grid-cols-3 gap-3">
        {/* Existing/Preview Images */}
        {imagePreviews.map((preview, index) => (
          <div
            key={index}
            className="relative aspect-square rounded-lg overflow-hidden bg-gray-700 group"
          >
            <Image
              src={preview}
              alt={`Preview ${index + 1}`}
              fill
              className="object-cover"
              sizes="150px"
            />
            {/* Remove button */}
            <button
              type="button"
              onClick={() => handleRemoveImage(index)}
              className="
                absolute top-1 right-1
                w-6 h-6 rounded-full
                bg-red-500 text-white
                flex items-center justify-center
                opacity-0 group-hover:opacity-100
                transition-opacity
                hover:bg-red-600
              "
              title="Supprimer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}

        {/* Add More Button */}
        {canAddMore && (
          <label className="relative aspect-square rounded-lg border-2 border-dashed border-gray-600 hover:border-orange-500 bg-gray-800 hover:bg-gray-700 transition-all cursor-pointer flex flex-col items-center justify-center group">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <Upload className="w-8 h-8 text-gray-500 group-hover:text-orange-500 mb-2" />
            <span className="text-xs text-gray-500 group-hover:text-orange-500 text-center px-2">
              Ajouter une image
            </span>
          </label>
        )}
      </div>

      <p className="text-xs text-gray-500 mt-2">
        Format: JPG, PNG, WebP (max 5MB par image)
      </p>
    </div>
  );
}
