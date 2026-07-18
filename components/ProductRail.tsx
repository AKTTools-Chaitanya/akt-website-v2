import Link from 'next/link';
import type { Product } from '@/lib/types';
import { ProductCard, type Badge } from './ProductCard';

/** Horizontal, snap-scrolling rail of product cards with a section heading + optional badges. */
export function ProductRail({
  title,
  products,
  viewAllHref,
  getBadge,
}: {
  title: string;
  products?: Product[];
  viewAllHref?: string;
  getBadge?: (p: Product, i: number) => Badge | undefined;
}) {
  if (!products?.length) return null;

  return (
    <section className="container-x mt-12 sm:mt-16">
      <div className="flex items-end justify-between gap-4">
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{title}</h2>
        {viewAllHref && (
          <Link href={viewAllHref} className="shrink-0 text-[13px] font-semibold text-brand transition hover:underline">
            View all →
          </Link>
        )}
      </div>

      <div className="scrollbar-hide mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
        {products.map((p, i) => (
          <div key={String(p.pro_id)} className="w-[46%] shrink-0 snap-start sm:w-[230px]">
            <ProductCard p={p} badge={getBadge?.(p, i)} />
          </div>
        ))}
      </div>
    </section>
  );
}
