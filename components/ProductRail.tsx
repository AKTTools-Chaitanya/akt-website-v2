import Link from 'next/link';
import type { Product } from '@/lib/types';
import { ProductCard } from './ProductCard';

/** Horizontal, snap-scrolling rail of product cards with a section heading. */
export function ProductRail({
  title,
  products,
  viewAllHref,
}: {
  title: string;
  products?: Product[];
  viewAllHref?: string;
}) {
  if (!products?.length) return null;

  return (
    <section className="container-x mt-10">
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
        {viewAllHref && (
          <Link href={viewAllHref} className="shrink-0 text-sm font-medium text-brand hover:underline">
            View all
          </Link>
        )}
      </div>

      <div className="scrollbar-hide mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
        {products.map((p) => (
          <div
            key={String(p.pro_id)}
            className="w-[46%] shrink-0 snap-start sm:w-[220px]"
          >
            <ProductCard p={p} />
          </div>
        ))}
      </div>
    </section>
  );
}
