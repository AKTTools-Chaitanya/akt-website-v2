'use client';

import { useCart, type CartItem } from '@/lib/cart';

/**
 * Compact outlined "Add" that expands into a − qty + stepper (the grocery / quick-commerce
 * pattern). Subtle by default; the stepper suits technicians who buy in multiples. Stays in
 * sync with the cart, so the header total updates live.
 */
export function QuickAdd({ item, disabled }: { item: Omit<CartItem, 'qty'>; disabled?: boolean }) {
  const { items, add, setQty } = useCart();
  const qty = items.find((i) => i.id === item.id)?.qty ?? 0;

  if (disabled) {
    return <span className="text-[12px] font-medium text-ink-muted">Out of stock</span>;
  }

  const stop = (fn: () => void) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    fn();
  };

  if (qty === 0) {
    return (
      <button
        type="button"
        onClick={stop(() => add(item, 1))}
        aria-label={`Add ${item.name} to cart`}
        className="inline-flex h-9 items-center rounded-lg border border-brand/50 px-4 text-[13px] font-semibold text-brand transition hover:bg-brand hover:text-white sm:px-5"
      >
        Add
      </button>
    );
  }

  return (
    <div className="inline-flex h-9 items-center rounded-lg border border-brand/50 text-brand">
      <button
        type="button"
        onClick={stop(() => setQty(item.id, qty - 1))}
        aria-label="Decrease quantity"
        className="flex h-full w-9 items-center justify-center text-base leading-none transition hover:bg-brand/[0.06]"
      >
        −
      </button>
      <span className="w-7 text-center text-[13px] font-semibold tabular-nums">{qty}</span>
      <button
        type="button"
        onClick={stop(() => setQty(item.id, qty + 1))}
        aria-label="Increase quantity"
        className="flex h-full w-9 items-center justify-center text-base leading-none transition hover:bg-brand/[0.06]"
      >
        +
      </button>
    </div>
  );
}
