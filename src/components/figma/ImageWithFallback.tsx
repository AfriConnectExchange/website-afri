"use client";
import React, { useState } from 'react';
import Image, { ImageProps } from 'next/image';

interface ImageWithFallbackProps extends ImageProps {
  fallbackSrc?: string;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({ src, fallbackSrc, ...props }) => {
  const [error, setError] = useState(false);

  const handleError = () => {
    setError(true);
  };

  const imageSrc = (error && fallbackSrc) ? fallbackSrc : src;

  // Ensure alt prop exists for accessibility and to satisfy Next.js checks
  const altText = props.alt ?? 'image';

  return (
    <Image
      {...props}
      alt={altText}
      src={imageSrc as string}
      onError={handleError}
      width={(props.width as number) || 300}
      height={(props.height as number) || 200}
    />
  );
};
