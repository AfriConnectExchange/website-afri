
'use client';

import { useState, useEffect } from 'react';
import React from 'react';
import { ProductPageComponent } from '@/components/product/product-page';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/dashboard/header';
import type { Product } from '@/app/marketplace/page';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/context/cart-context';

export default function ProductDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { addToCart, cartCount } = useCart();
  const { toast } = useToast();

  const { id } = React.use(params);

  const handleNavigate = (page: string, newProductId?: string) => {
    if (page === 'product' && newProductId) {
      router.push(`/product/${newProductId}`);
    } else {
      router.push(`/${page}`);
    }
  };

  const onAddToCart = (product: Product, quantity: number) => {
    addToCart(product, quantity);
  };

  return (
    <>
      <Header cartCount={cartCount} />
      <ProductPageComponent 
        productId={id} 
        onNavigate={handleNavigate} 
        onAddToCart={onAddToCart} 
      />
    </>
  );
}
