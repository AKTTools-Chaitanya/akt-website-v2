import Image from 'next/image';
import Link from 'next/link';
import { mediaUrl } from '@/lib/media';
import { categoryUrl } from '@/lib/config';
import type { HomeCategory } from '@/lib/types';

/** Shop by category — large photo cards. Real category imagery carries the richness. */
export function CategoryShowcase({ categories }: { categories?: HomeCategory[] }) {
  if (!categories?.length) return null;
  const cats = categories.slice(0, 10);

  return (
    <section id="categories" className="container-x mt-12 sm:mt-16">
      <div className="mb-5 flex items-end justify-between gap-4">
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Shop by category</h2>
        <Link href="/search" className="shrink-0 text-[13px] font-semibold text-brand transition hover:underline">View all categories →</Link>
      </div>

      <div className="scrollbar-hide flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible lg:grid-cols-5">
        {cats.map((c) => {
          const img = mediaUrl(c.image_path, c.image);
          return (
            <Link
              key={String(c.id)}
              href={categoryUrl(c.slug)}
              className="group flex w-[28%] min-w-[98px] shrink-0 flex-col overflow-hidden rounded-2xl border border-surface-border bg-surface shadow-card transition hover:-translate-y-0.5 hover:shadow-hover sm:w-auto sm:min-w-0"
            >
              <div className="relative aspect-square bg-surface-alt sm:aspect-[4/3]">
                {img ? (
                  <Image src={img} alt={c.title} fill sizes="(max-width:640px) 120px, 220px" className="object-contain p-3 mix-blend-multiply transition duration-300 group-hover:scale-[1.04] sm:p-5" />
                ) : null}
              </div>
              <div className="flex items-center justify-between gap-1.5 px-3 py-2.5 sm:px-4 sm:py-3.5">
                <span className="line-clamp-2 text-[12px] font-semibold leading-tight text-ink group-hover:text-brand sm:text-[13.5px]">{c.title}</span>
                <span className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/[0.08] text-brand transition group-hover:bg-brand group-hover:text-white sm:flex">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
