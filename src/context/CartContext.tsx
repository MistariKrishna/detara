'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';
import { trackAddToCart } from '@/lib/analytics';

export interface CartItem {
  id: string;
  name: string;
  shape: string;
  carat: string;
  metal: string;
  origin: string;
  price: number;
  quantity: number;
  img: string;
  alt: string;
  slug?: string;
  productId?: string;
  ringSize?: string;
  braceletLength?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, delta: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  totalPrice: number;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | null>(null);

const CART_STORAGE_KEY = 'detara-cart';

export function CartProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // LOAD CART FROM LOCAL STORAGE
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);

      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);

        if (Array.isArray(parsedCart)) {
          const validCart = parsedCart.filter(
            (item): item is CartItem =>
              item &&
              typeof item.id === 'string' &&
              typeof item.name === 'string' &&
              typeof item.price === 'number' &&
              Number.isFinite(item.price) &&
              item.price >= 0 &&
              typeof item.quantity === 'number' &&
              item.quantity > 0
          );

          setItems(validCart);
        }
      }
    } catch (error) {
      console.error('[CartContext] Failed to load cart:', error);
      setItems([]);
    } finally {
      setCartLoaded(true);
    }
  }, []);

  // SAVE CART TO LOCAL STORAGE
  useEffect(() => {
    if (!cartLoaded) return;

    try {
      localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify(items)
      );
    } catch (error) {
      console.error('[CartContext] Failed to save cart:', error);
    }
  }, [items, cartLoaded]);

  // ADD ITEM
  const addItem = useCallback(
    (newItem: Omit<CartItem, 'quantity'>) => {
      setItems((prev) => {
        const existing = prev.find(
          (item) => item.id === newItem.id
        );

        if (existing) {
          return prev.map((item) =>
            item.id === newItem.id
              ? {
                  ...item,
                  quantity: item.quantity + 1,
                }
              : item
          );
        }

        return [
          ...prev,
          {
            ...newItem,
            price: Number(newItem.price) || 0,
            quantity: 1,
          },
        ];
      });

      setDrawerOpen(true);

      // GA4 add_to_cart event
      try {
        trackAddToCart({
          id: newItem.id,
          name: newItem.name,
          price: Number(newItem.price) || 0,
          quantity: 1,
          variant: `${newItem.origin} ${newItem.carat}ct ${newItem.metal}`,
        });
      } catch (error) {
        console.error(
          '[CartContext] Analytics error:',
          error
        );
      }
    },
    []
  );

  // REMOVE ITEM
  const removeItem = useCallback((id: string) => {
    setItems((prev) =>
      prev.filter((item) => item.id !== id)
    );
  }, []);

  // UPDATE QUANTITY
  const updateQty = useCallback(
    (id: string, delta: number) => {
      setItems((prev) =>
        prev
          .map((item) =>
            item.id === id
              ? {
                  ...item,
                  quantity: item.quantity + delta,
                }
              : item
          )
          .filter((item) => item.quantity > 0)
      );
    },
    []
  );

  // CLEAR CART
  const clearCart = useCallback(() => {
    setItems([]);

    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch (error) {
      console.error(
        '[CartContext] Failed to clear local storage:',
        error
      );
    }
  }, []);

  // TOTAL ITEMS
  const totalItems = items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  // SUBTOTAL
  const subtotal = items.reduce((sum, item) => {
    const price = Number(item.price) || 0;
    const quantity = Number(item.quantity) || 0;

    return sum + price * quantity;
  }, 0);

  // TOTAL PRICE
  const totalPrice = subtotal;

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQty,
        clearCart,
        totalItems,
        subtotal,
        totalPrice,
        drawerOpen,
        setDrawerOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);

  if (!ctx) {
    throw new Error(
      'useCart must be used within CartProvider'
    );
  }

  return ctx;
}