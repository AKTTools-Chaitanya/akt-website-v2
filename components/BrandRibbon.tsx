import Image from 'next/image';
import Link from 'next/link';
import { mediaUrl } from '@/lib/media';
import { brandUrl } from '@/lib/config';
import type { HomeBrand } from '@/lib/types';

/** "Trusted by professionals" — same card treatment as Shop by category. Brands shown clearly. */
export function BrandRibbon({ brands }: { brands?: HomeBrand[] }) {
  if (!brands?.length) return null;
  return (
    <section className="container-x mt-12 sm:mt-16">
      <div className="mb-5 flex items-end justify-between gap-4">
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Trusted Brands</h2>
        <Link href="/search" className="shrink-0 text-[13px] font-semibold text-brand transition hover:underline">All brands →</Link>
      </div>

      <div className="scrollbar-hide flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible lg:grid-cols-6">
        {brands.slice(0, 12).map((b) => {
          const img = mediaUrl(b.brand_image_path, b.brand_image);
          return (
            <Link
              key={String(b.brand_id)}
              href={brandUrl(b.slug)}
              className="group flex w-[28%] min-w-[98px] shrink-0 flex-col overflow-hidden rounded-2xl border border-surface-border bg-surface shadow-card transition hover:-translate-y-0.5 hover:shadow-hover sm:w-auto sm:min-w-0"
            >
              <div className="relative aspect-square bg-surface-alt sm:aspect-[4/3]">
                {img ? (
                  <Image src={img} alt={b.brand_name} fill sizes="(max-width:640px) 110px, 200px" className="object-contain p-3.5 transition duration-300 group-hover:scale-[1.04] sm:p-6" />
                ) : (
                  <div className="flex h-full items-center justify-center px-2 text-center text-[13px] font-bold text-ink">{b.brand_name}</div>
                )}
              </div>
              <div className="px-3 py-2.5 sm:px-4 sm:py-3.5">
                <span className="line-clamp-1 text-[12px] font-semibold leading-tight text-ink group-hover:text-brand sm:text-[13.5px]">{b.brand_name}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
