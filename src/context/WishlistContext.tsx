'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

export interface WishlistItem {
  id: number;
  name: string;
  spec: string;
  metal: string;
  price: string;
  img: string;
  alt: string;
  slug: string;
}

interface WishlistContextType {
  items: WishlistItem[];
  toggleItem: (item: WishlistItem) => void;
  isWishlisted: (id: number) => boolean;
  removeItem: (id: number) => void;
  totalItems: number;
}

const WishlistContext = createContext<WishlistContextType | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);

  const toggleItem = useCallback((item: WishlistItem) => {
    setItems((prev) => {
      const exists = prev.find((i) => i.id === item.id);
      if (exists) return prev.filter((i) => i.id !== item.id);
      return [...prev, item];
    });
  }, []);

  const isWishlisted = useCallback((id: number) => items.some((i) => i.id === id), [items]);

  const removeItem = useCallback((id: number) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const totalItems = items.length;

  return (
    <WishlistContext.Provider value={{ items, toggleItem, isWishlisted, removeItem, totalItems }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}

export { WishlistContext };