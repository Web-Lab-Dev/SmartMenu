'use client';

import { useState, memo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';

interface ImageCarouselProps {
  images: string[];
  alt: string;
  className?: string;
}

function ImageCarouselComponent({
  images,
  alt,
  className = '',
}: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className={`bg-gray-700 flex items-center justify-center ${className}`}>
        <svg
          className="w-12 h-12 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  const goToPrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const goToIndex = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(index);
  };

  // Single image - no carousel needed
  if (images.length === 1 && images[0]) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <Image
          src={images[0]}
          alt={alt}
          fill
          className="object-cover"
          sizes="96px"
        />
      </div>
    );
  }

  // Multiple images - show carousel
  return (
    <div className={`relative overflow-hidden group ${className}`}>
      {/* Current Image */}
      <Image
        src={images[currentIndex] || ''}
        alt={`${alt} ${currentIndex + 1}`}
        fill
        className="object-cover"
        sizes="96px"
      />

      {/* Navigation Arrows - visible on mobile, hover on desktop */}
      <button
        onClick={goToPrevious}
        className="
          absolute left-1 top-1/2 -translate-y-1/2
          w-6 h-6 rounded-full
          bg-black/70 text-white
          flex items-center justify-center
          opacity-100 md:opacity-0 md:group-hover:opacity-100
          transition-opacity
          hover:bg-black/90
        "
        title="Image précédente"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <button
        onClick={goToNext}
        className="
          absolute right-1 top-1/2 -translate-y-1/2
          w-6 h-6 rounded-full
          bg-black/70 text-white
          flex items-center justify-center
          opacity-100 md:opacity-0 md:group-hover:opacity-100
          transition-opacity
          hover:bg-black/90
        "
        title="Image suivante"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={(e) => goToIndex(index, e)}
            className={`
              w-1.5 h-1.5 rounded-full transition-all
              ${
                index === currentIndex
                  ? 'bg-orange-500 w-3'
                  : 'bg-white/50 hover:bg-white/75'
              }
            `}
            title={`Image ${index + 1}`}
          />
        ))}
      </div>

      {/* Image Counter Badge */}
      <div className="absolute top-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded-full font-medium">
        {currentIndex + 1}/{images.length}
      </div>
    </div>
  );
}

// Export memoized version for performance
const ImageCarousel = memo(ImageCarouselComponent);
export default ImageCarousel;
