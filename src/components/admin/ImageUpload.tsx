// ========================================
// ImageUpload Component
// ========================================
// Single image uploader with Firebase Storage integration
// Used for restaurant branding (logo, cover)

'use client';

import { useState, useRef } from 'react';
import { Upload, X, Loader2, ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { StorageService } from '@/services/StorageService';
import { toast } from 'sonner';

interface ImageUploadProps {
  label: string;
  value?: string; // Current image URL
  onChange: (url: string | null) => void;
  restaurantId: string;
  path: 'logo' | 'cover'; // Storage path: restaurants/{id}/branding/{path}
  aspectRatio?: 'square' | 'wide'; // square = 1:1, wide = 16:9
  helpText?: string;
}

/**
 * Single image upload component with Firebase Storage
 * Features:
 * - Drag & drop support
 * - Image preview
 * - Upload progress
 * - File validation (size, format)
 * - Instant upload to Firebase Storage
 */
export default function ImageUpload({
  label,
  value,
  onChange,
  restaurantId,
  path,
  aspectRatio = 'square',
  helpText,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const aspectClass = aspectRatio === 'square' ? 'aspect-square' : 'aspect-video';

  const handleFileSelect = async (file: File) => {
    // Validate file
    const validation = StorageService.validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error || 'Fichier invalide');
      return;
    }

    try {
      setUploading(true);
      setProgress(0);

      // Upload to Firebase Storage
      const storageRef = `restaurants/${restaurantId}/branding/${path}`;
      const storage = await import('@/lib/firebase').then((m) => m.getStorageInstance());
      const { ref, uploadBytesResumable, getDownloadURL } = await import('firebase/storage');

      // Generate unique filename
      const timestamp = Date.now();
      const extension = file.name.split('.').pop();
      const fileName = `${path}_${timestamp}.${extension}`;
      const fileRef = ref(storage, `${storageRef}/${fileName}`);

      // Upload with progress
      const uploadTask = uploadBytesResumable(fileRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const prog = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(Math.round(prog));
        },
        (error) => {
          console.error('[ImageUpload] Upload failed:', error);
          toast.error('Échec du téléchargement');
          setUploading(false);
        },
        async () => {
          // Upload completed
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          onChange(downloadURL);
          toast.success('Image téléchargée avec succès');
          setUploading(false);
          setProgress(0);
        }
      );
    } catch (error) {
      console.error('[ImageUpload] Error:', error);
      toast.error('Erreur lors du téléchargement');
      setUploading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // Reset input
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleFileSelect(file);
    } else {
      toast.error('Veuillez déposer un fichier image');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleRemove = () => {
    onChange(null);
    toast.success('Image supprimée');
  };

  const handleClick = () => {
    if (!uploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        {label}
      </label>

      <div
        className={`
          relative ${aspectClass} rounded-xl overflow-hidden
          border-2 transition-all
          ${isDragging ? 'border-orange-500 bg-orange-500/10' : 'border-gray-700'}
          ${uploading ? 'cursor-wait' : 'cursor-pointer'}
          ${value ? 'bg-gray-800' : 'bg-gray-900'}
        `}
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          className="hidden"
          disabled={uploading}
        />

        {/* Current image */}
        {value && !uploading && (
          <>
            <Image
              src={value}
              alt={label}
              fill
              className="object-cover"
              sizes={aspectRatio === 'square' ? '200px' : '400px'}
            />
            {/* Overlay with actions */}
            <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClick();
                }}
                className="px-4 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors font-medium text-sm flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Changer
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium text-sm flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Supprimer
              </button>
            </div>
          </>
        )}

        {/* Upload placeholder */}
        {!value && !uploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-3">
              <ImageIcon className="w-8 h-8 text-gray-500" />
            </div>
            <p className="text-sm font-medium text-gray-300 mb-1">
              Cliquez ou glissez-déposez
            </p>
            <p className="text-xs text-gray-500">
              JPG, PNG, WebP (max 5MB)
            </p>
          </div>
        )}

        {/* Uploading state */}
        {uploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin mb-3" />
            <p className="text-sm font-medium text-gray-300 mb-2">
              Téléchargement...
            </p>
            <div className="w-full max-w-xs px-6">
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1 text-center">{progress}%</p>
            </div>
          </div>
        )}
      </div>

      {/* Help text */}
      {helpText && (
        <p className="text-xs text-gray-500 mt-2">{helpText}</p>
      )}
    </div>
  );
}
