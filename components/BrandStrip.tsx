import Image from 'next/image';
import Link from 'next/link';
import { mediaUrl } from '@/lib/media';
import { brandUrl } from '@/lib/config';
import type { HomeBrand } from '@/lib/types';

/** Popular brands — logo chips in a horizontal scroller. */
export function BrandStrip({ brands }: { brands?: HomeBrand[] }) {
  if (!brands?.length) return null;

  return (
    <section className="container-x mt-10">
      <h2 className="text-lg font-semibold tracking-tight sm:text-xl">Popular brands</h2>
      <div className="scrollbar-hide mt-4 flex gap-3 overflow-x-auto pb-2">
        {brands.map((b) => {
          const img = mediaUrl(b.brand_image_path, b.brand_image);
          return (
            <Link
              key={String(b.brand_id)}
              href={brandUrl(b.slug)}
              className="flex h-20 w-32 shrink-0 items-center justify-center rounded-card border border-surface-border bg-surface p-4 transition hover:shadow-hover"
              title={b.brand_name}
            >
              {img ? (
                <div className="relative h-full w-full">
                  <Image src={img} alt={b.brand_name} fill sizes="128px" className="object-contain" />
                </div>
              ) : (
                <span className="text-center text-sm text-ink-soft">{b.brand_name}</span>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
