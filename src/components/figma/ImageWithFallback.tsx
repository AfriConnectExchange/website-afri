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

  // Validate that src is a valid string
  const isValidSrc = typeof src === 'string' && src.trim() !== '';
  
  // Use fallback if src is invalid or if there was an error
  const imageSrc = (!isValidSrc || error) && fallbackSrc ? fallbackSrc : src;
  
  // Don't render if we don't have a valid source
  if (!isValidSrc && !fallbackSrc) {
    return null;
  }

  return (
    <Image
      {...props}
      src={imageSrc}
      onError={handleError}
      width={props.width || 300}
      height={props.height || 200}
    />
  );
};
