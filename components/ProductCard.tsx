import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/lib/types';
import { priceView, formatINR, firstImage, inStock } from '@/lib/price';
import { productUrl, bench } from '@/lib/config';
import { QuickAdd } from './QuickAdd';

export type Badge = { label: string; tone?: 'brand' | 'green' | 'amber' | 'ink' };

const TONES: Record<NonNullable<Badge['tone']>, string> = {
  brand: 'bg-brand text-white',
  green: 'bg-emerald-600 text-white',
  amber: 'bg-signal text-white',
  ink: 'bg-ink text-white',
};

/**
 * Reference-style product card: corner badge + wishlist, real photo, brand · name, then a strong
 * price line (price · struck MRP · red %off) and a quick-add. Rich but never noisy.
 */
export function ProductCard({ p, badge }: { p: Product; badge?: Badge }) {
  const pv = priceView(p);
  const img = firstImage(p.pro_image);
  const available = inStock(p);
  const qty = Number(p.qty) || 0;
  const lowStock = available && qty <= bench.lowStockThreshold;
  const brand = (p as { brand_name?: string }).brand_name;

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-surface-border bg-surface shadow-card transition duration-200 hover:-translate-y-1 hover:shadow-hover">
      <Link href={productUrl(p.pro_url)} className="flex flex-1 flex-col">
        <div className="relative aspect-square bg-surface-alt">
          {img ? (
            <Image src={img} alt={p.pro_name} fill sizes="(max-width: 640px) 46vw, 240px" className="object-contain p-4 mix-blend-multiply transition duration-300 group-hover:scale-[1.04]" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-ink-muted">No image</div>
          )}

          {badge && (
            <span className={`absolute left-2.5 top-2.5 rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${TONES[badge.tone ?? 'brand']}`}>
              {badge.label}
            </span>
          )}

          <button type="button" aria-label="Add to wishlist" className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full border border-surface-border bg-surface/90 text-ink-muted backdrop-blur transition hover:text-brand">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M20.8 6.6a5 5 0 0 0-8.8-2.2A5 5 0 0 0 3.2 6.6c0 4.4 8.8 10 8.8 10s8.8-5.6 8.8-10Z" /></svg>
          </button>

          {!available && (
            <span className="absolute inset-x-0 bottom-0 bg-ink/70 py-1 text-center text-[11px] font-semibold text-white">Out of stock</span>
          )}
        </div>

        <div className="flex flex-1 flex-col px-3.5 pt-3">
          {brand && <div className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">{brand}</div>}
          <p className="mt-0.5 line-clamp-2 min-h-[2.5em] text-[13.5px] font-medium leading-snug text-ink">{p.pro_name}</p>
        </div>
      </Link>

      <div className="flex items-end justify-between gap-2 px-3.5 pb-3.5 pt-2.5">
        <div className="min-w-0">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[16px] font-bold tabular-nums text-ink">{formatINR(pv.price)}</span>
            {pv.onSale && <span className="text-xs tabular-nums text-ink-muted line-through">{formatINR(pv.mrp)}</span>}
          </div>
          {pv.onSale ? (
            <div className="mt-0.5 text-[11px] font-bold text-brand">{pv.discountPct}% OFF</div>
          ) : lowStock ? (
            <div className="mt-0.5 text-[11px] font-medium text-signal">Only {qty} left</div>
          ) : null}
        </div>
        <QuickAdd
          item={{ id: String(p.pro_id ?? (p as { id?: string }).id), name: p.pro_name, price: pv.price, image: img, slug: p.pro_url }}
          disabled={!available}
        />
      </div>
    </div>
  );
}
