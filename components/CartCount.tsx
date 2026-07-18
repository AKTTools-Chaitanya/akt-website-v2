'use client';

import Link from 'next/link';
import { useCart } from '@/lib/cart';

/** Live cart button — an ink pill with the value in mono and a red count badge. */
export function CartCount() {
  const { count, subtotal, ready } = useCart();
  return (
    <Link
      href="/cart"
      aria-label="Cart"
      className="relative flex items-center gap-2 rounded-lg bg-ink px-3 py-2 text-white transition hover:bg-black"
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" />
        <path d="M2 3h2.2l2.1 12.4a1.5 1.5 0 0 0 1.5 1.2h9a1.5 1.5 0 0 0 1.5-1.2L21 7H5.4" />
      </svg>
      <span className="font-mono text-xs font-bold tabular-nums">
        {ready && subtotal > 0 ? `₹${subtotal.toLocaleString('en-IN')}` : '₹0'}
      </span>
      {ready && count > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 font-mono text-[10px] font-bold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
