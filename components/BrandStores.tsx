import Image from 'next/image';
import Link from 'next/link';
import { mediaUrl } from '@/lib/media';
import { brandUrl } from '@/lib/config';
import type { HomeBrand } from '@/lib/types';

/**
 * Brands framed as authenticity anchors — "Official · Genuine" — not a decorative logo strip.
 * In this market the brand IS the counterfeit-vs-genuine signal technicians buy on.
 */
export function BrandStores({ brands }: { brands?: HomeBrand[] }) {
  if (!brands?.length) return null;

  return (
    <section className="container-x mt-10">
      <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Official brand stores</h2>
      <p className="mt-0.5 text-sm text-ink-soft">Genuine stock, straight from the source.</p>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {brands.slice(0, 12).map((b) => {
          const img = mediaUrl(b.brand_image_path, b.brand_image);
          return (
            <Link
              key={String(b.brand_id)}
              href={brandUrl(b.slug)}
              className="flex flex-col items-center gap-2.5 rounded-2xl border border-surface-border bg-surface p-4 transition hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-hover"
            >
              <div className="relative flex h-16 w-full items-center justify-center">
                {img ? (
                  <Image src={img} alt={b.brand_name} fill sizes="160px" className="object-contain mix-blend-multiply" />
                ) : (
                  <span className="text-base font-bold text-ink">{b.brand_name}</span>
                )}
              </div>
              <div className="text-center">
                <div className="line-clamp-1 text-[13.5px] font-semibold text-ink">{b.brand_name}</div>
                <div className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-ink-muted">
                  <span className="text-brand">✓</span> Genuine
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
