import type { Product, PriceView } from './types';

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export function formatINR(n: number): string {
  return inr.format(Math.round(n));
}

/**
 * Mirrors the storefront/feed rule: AKT sells at pro_discounted_price when > 0, else
 * pro_actual_price. price = MRP (strikethrough), sale price = what the customer pays.
 */
export function priceView(p: Product): PriceView {
  const mrp = Number(p.pro_actual_price) || 0;
  const disc = Number(p.pro_discounted_price) || 0;
  const onSale = disc > 0 && disc < mrp;
  const price = onSale ? disc : (mrp > 0 ? mrp : disc);
  const discountPct = onSale && mrp > 0 ? Math.round(((mrp - price) / mrp) * 100) : 0;
  return { mrp, price, onSale, discountPct };
}

export function firstImage(pro_image: string): string {
  return (pro_image || '').split(',').map((s) => s.trim()).filter(Boolean)[0] ?? '';
}

export function allImages(pro_image: string): string[] {
  return (pro_image || '').split(',').map((s) => s.trim()).filter(Boolean);
}

export function inStock(p: Product): boolean {
  return Number(p.qty) > 0;
}
