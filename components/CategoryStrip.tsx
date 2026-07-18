import Image from 'next/image';
import Link from 'next/link';
import { mediaUrl } from '@/lib/media';
import { categoryUrl } from '@/lib/config';
import type { HomeCategory } from '@/lib/types';

/** Shop by category — real category photography. Scrolls on mobile, grids on desktop. */
export function CategoryStrip({ categories }: { categories?: HomeCategory[] }) {
  if (!categories?.length) return null;

  return (
    <section className="container-x mt-8">
      <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Shop by category</h2>
      <div className="scrollbar-hide mt-4 flex gap-3.5 overflow-x-auto pb-2 sm:grid sm:grid-cols-5 sm:gap-4 lg:grid-cols-8">
        {categories.slice(0, 16).map((c) => {
          const img = mediaUrl(c.image_path, c.image);
          return (
            <Link
              key={String(c.id)}
              href={categoryUrl(c.slug)}
              className="group flex w-[112px] shrink-0 flex-col sm:w-auto"
            >
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-surface-alt transition group-hover:shadow-hover">
                {img ? (
                  <Image
                    src={img}
                    alt={c.title}
                    fill
                    sizes="(max-width: 640px) 112px, 140px"
                    className="object-contain p-2.5 mix-blend-multiply transition duration-300 group-hover:scale-105"
                  />
                ) : null}
              </div>
              <span className="mt-2 line-clamp-2 text-center text-[12.5px] font-medium leading-tight text-ink group-hover:text-brand">
                {c.title}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
