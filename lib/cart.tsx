'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/**
 * Phase-1 cart: client-side, persisted to localStorage. No backend — quick-add works instantly
 * and the count is live. At checkout (P1-b) these lines are handed to the existing order API.
 */
export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  slug: string;
  qty: number;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  add: (item: Omit<CartItem, 'qty'>, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  ready: boolean;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = 'akt_cart_v1';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* ignore corrupt storage */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore quota */
    }
  }, [items, ready]);

  const add = useCallback((item: Omit<CartItem, 'qty'>, qty = 1) => {
    setItems((prev) => {
      const i = prev.findIndex((x) => x.id === item.id);
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i], qty: next[i].qty + qty };
        return next;
      }
      return [...prev, { ...item, qty }];
    });
  }, []);

  const setQty = useCallback((id: string, qty: number) => {
    setItems((prev) => {
      if (qty <= 0) return prev.filter((x) => x.id !== id);
      const i = prev.findIndex((x) => x.id === id);
      if (i < 0) return prev;
      const next = [...prev];
      next[i] = { ...next[i], qty };
      return next;
    });
  }, []);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((n, i) => n + i.qty, 0);
    const subtotal = items.reduce((n, i) => n + i.qty * i.price, 0);
    return { items, count, subtotal, add, setQty, ready };
  }, [items, add, setQty, ready]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within <CartProvider>');
  return ctx;
}
