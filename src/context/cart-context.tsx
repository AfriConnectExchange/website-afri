
'use client';

import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Product } from '@/app/marketplace/page';

export interface CartItem extends Product {
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: Product, quantity?: number) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, newQuantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedCart = localStorage.getItem('cartItems');
      if (storedCart) {
        setCart(JSON.parse(storedCart));
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (cart.length > 0) {
        localStorage.setItem('cartItems', JSON.stringify(cart));
      } else {
        localStorage.removeItem('cartItems');
      }
    }
  }, [cart]);

  const addToCart = useCallback((item: Product, quantity: number = 1) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem.id === item.id);
      if (existingItem) {
        // If item exists, update its quantity
        return prevCart.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + quantity }
            : cartItem
        );
      } else {
        // If item doesn't exist, add it to the cart
        return [...prevCart, { ...item, quantity }];
      }
    });
  }, []);

  const removeFromCart = useCallback((itemId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== itemId));
    toast({
        variant: 'destructive',
        title: 'Item Removed',
        description: `Item has been removed from your cart.`,
    });
  }, [toast]);

  const updateQuantity = useCallback((itemId: string, newQuantity: number) => {
    setCart((prevCart) => {
       const itemToUpdate = prevCart.find(item => item.id === itemId);
        if (!itemToUpdate) return prevCart;

        if (newQuantity < 1) {
            return prevCart.filter(item => item.id !== itemId);
        }
        
        if (newQuantity > itemToUpdate.quantity_available) {
            toast({
                variant: 'destructive',
                title: 'Stock Limit Reached',
                description: `You cannot add more than ${itemToUpdate.quantity_available} of this item.`,
            });
            return prevCart.map((item) =>
                item.id === itemId ? { ...item, quantity: itemToUpdate.quantity_available } : item
            );
        }

        return prevCart.map((item) =>
            item.id === itemId ? { ...item, quantity: newQuantity } : item
        );
    });
  }, [toast]);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const cartCount = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantity, 0);
  }, [cart]);

  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [cart]);

  const value = useMemo(() => ({
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartCount,
    subtotal,
  }), [cart, addToCart, removeFromCart, updateQuantity, clearCart, cartCount, subtotal]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
