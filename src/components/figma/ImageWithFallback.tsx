
'use client';
import React, { useState } from 'react';
import Image, { ImageProps } from 'next/image';

interface ImageWithFallbackProps extends Omit<ImageProps, 'width' | 'height'> {
  fallbackSrc?: string;
  width?: number;
  height?: number;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  fallbackSrc,
  fill,
  width,
  height,
  ...props
}) => {
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

  const imageProps: ImageProps = {
    ...props,
    src: imageSrc,
    onError: handleError,
  };

  if (fill) {
    imageProps.fill = true;
  } else {
    imageProps.width = width || 300;
    imageProps.height = height || 200;
  }

  return <Image {...imageProps} />;
};
