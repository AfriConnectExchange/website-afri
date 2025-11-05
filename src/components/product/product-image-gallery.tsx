
'use client';

import { useState } from 'react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { Package } from 'lucide-react';

interface ProductImageGalleryProps {
  images: Array<{ url: string; alt?: string } | string> | string[];
  productName: string;
}

// Helper to extract URL from image (handles both object and string formats)
const getImageUrl = (image: { url: string } | string): string => {
  if (typeof image === 'string') return image;
  if (image && typeof image === 'object' && 'url' in image) return image.url;
  return '';
};

export function ProductImageGallery({ images, productName }: ProductImageGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Convert images to URL strings and filter out invalid ones
  const imageUrls = images
    .map(img => getImageUrl(img))
    .filter(url => url && url.trim() !== '');

  // If no valid images, show placeholder
  if (imageUrls.length === 0) {
    return (
      <div className="space-y-3">
        <div className="aspect-square overflow-hidden rounded-lg shadow-md bg-muted flex items-center justify-center">
          <Package className="w-24 h-24 text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="aspect-square overflow-hidden rounded-lg shadow-md bg-muted">
        <ImageWithFallback
          src={imageUrls[selectedImageIndex]}
          fallbackSrc="/placeholder.svg"
          alt={productName}
          fill
          className="w-full h-full object-cover"
        />
      </div>
      {imageUrls.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {imageUrls.map((imageUrl: string, index: number) => (
            <button
              key={index}
              onClick={() => setSelectedImageIndex(index)}
              className={`aspect-square overflow-hidden rounded-md border-2 transition-colors ${
                selectedImageIndex === index ? 'border-primary' : 'border-transparent hover:border-primary/50'
              }`}
            >
              <ImageWithFallback
                src={imageUrl}
                fallbackSrc="/placeholder.svg"
                alt={`${productName} ${index + 1}`}
                width={150}
                height={150}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
