'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './auth-context';
import { db } from '@/lib/firebaseClient';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { ProductDoc } from '@/lib/firestoreTypes';

interface WishlistItem {
  id: string;
  productId: string;
  userId: string;
  addedAt: Date;
  product?: ProductDoc;
}

interface WishlistContextType {
  wishlistItems: WishlistItem[];
  isLoading: boolean;
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  wishlistCount: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setWishlistItems([]);
      setIsLoading(false);
      return;
    }

    const q = query(
      collection(db, 'wishlists'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const items: WishlistItem[] = [];
      
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const item: WishlistItem = {
          id: docSnap.id,
          productId: data.productId,
          userId: data.userId,
          addedAt: data.addedAt?.toDate() || new Date(),
        };

        // Fetch product details
        try {
          const productDoc = await getDocs(
            query(collection(db, 'products'), where('__name__', '==', data.productId))
          );
          if (!productDoc.empty) {
            item.product = { id: productDoc.docs[0].id, ...productDoc.docs[0].data() } as ProductDoc;
          }
        } catch (error) {
          console.error('Error fetching product:', error);
        }

        items.push(item);
      }

      setWishlistItems(items);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const addToWishlist = async (productId: string) => {
    if (!user?.uid) {
      throw new Error('You must be logged in to add items to wishlist');
    }

    // Check if already in wishlist
    const existing = wishlistItems.find(item => item.productId === productId);
    if (existing) {
      throw new Error('Item already in wishlist');
    }

    await addDoc(collection(db, 'wishlists'), {
      userId: user.uid,
      productId,
      addedAt: new Date(),
    });
  };

  const removeFromWishlist = async (productId: string) => {
    const item = wishlistItems.find(i => i.productId === productId);
    if (!item) return;

    await deleteDoc(doc(db, 'wishlists', item.id));
  };

  const isInWishlist = (productId: string) => {
    return wishlistItems.some(item => item.productId === productId);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        isLoading,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        wishlistCount: wishlistItems.length,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
