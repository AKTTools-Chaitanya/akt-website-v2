import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/lib/types';
import { priceView, formatINR, firstImage, inStock } from '@/lib/price';
import { productUrl, bench } from '@/lib/config';
import { QuickAdd } from './QuickAdd';

/**
 * Clean, premium product card. Real product photo on a soft tint; a quiet white discount chip;
 * price · name; a single red "Add to cart" as the branded action. No borders-as-noise, no
 * loud color — the imagery carries the richness.
 */
export function ProductCard({ p }: { p: Product }) {
  const pv = priceView(p);
  const img = firstImage(p.pro_image);
  const available = inStock(p);
  const qty = Number(p.qty) || 0;
  const lowStock = available && qty <= bench.lowStockThreshold;
  const brand = (p as any).brand_name as string | undefined;

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-surface-border bg-surface transition duration-200 hover:-translate-y-0.5 hover:shadow-hover">
      <Link href={productUrl(p.pro_url)} className="flex flex-1 flex-col">
        <div className="relative aspect-square bg-surface-alt">
          {img ? (
            <Image
              src={img}
              alt={p.pro_name}
              fill
              sizes="(max-width: 640px) 46vw, 260px"
              className="object-contain p-4 mix-blend-multiply transition duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-ink-muted">No image</div>
          )}
          {pv.onSale && (
            <span className="absolute left-2.5 top-2.5 rounded-lg bg-surface px-2 py-0.5 text-[11px] font-semibold text-ink shadow-card">
              {pv.discountPct}% off
            </span>
          )}
          {!available && (
            <span className="absolute inset-x-0 bottom-0 bg-ink/70 py-1 text-center text-[11px] font-semibold text-white">
              Out of stock
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col px-3.5 pt-3">
          {brand && <div className="text-[11px] text-ink-muted">{brand}</div>}
          <p className="mt-0.5 line-clamp-2 min-h-[2.6em] text-[13.5px] leading-snug text-ink">{p.pro_name}</p>
        </div>
      </Link>

      <div className="flex items-end justify-between gap-2 px-3.5 pb-3.5 pt-2.5">
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-[15px] font-semibold tabular-nums text-ink">{formatINR(pv.price)}</span>
            {pv.onSale && (
              <span className="text-xs tabular-nums text-ink-muted line-through">{formatINR(pv.mrp)}</span>
            )}
          </div>
          {lowStock && <div className="mt-0.5 text-[11px] font-medium text-signal">Only {qty} left</div>}
        </div>
        <QuickAdd
          item={{
            id: String(p.pro_id ?? (p as any).id),
            name: p.pro_name,
            price: pv.price,
            image: img,
            slug: p.pro_url,
          }}
          disabled={!available}
        />
      </div>
    </div>
  );
}
