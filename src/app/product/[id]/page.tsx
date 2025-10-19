
'use client';

import { useState, useEffect } from 'react';
import { ProductPageComponent } from '@/components/product/product-page';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/dashboard/header';
import type { Product } from '@/app/marketplace/page';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/context/cart-context';

export default function ProductDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { addToCart, cartCount } = useCart();
  const { toast } = useToast();

  const handleNavigate = (page: string, newProductId?: string) => {
    if (page === 'product' && newProductId) {
      router.push(`/product/${newProductId}`);
    } else {
      router.push(`/${page}`);
    }
  };

  const onAddToCart = (product: Product, quantity: number) => {
    addToCart(product, quantity);
    toast({
      title: "Added to Cart",
      description: `${quantity} x ${product.name} has been added to your cart.`,
    });
  };

  return (
    <>
      <Header cartCount={cartCount} />
      <ProductPageComponent 
        productId={params.id} 
        onNavigate={handleNavigate} 
        onAddToCart={onAddToCart} 
      />
    </>
  );
}
