import Image from 'next/image';
import { mediaUrl } from '@/lib/media';
import type { Banner } from '@/lib/types';

/** Banner carousel — CSS scroll-snap (no JS lib). Swipe on mobile, drag/scroll on desktop. */
export function Hero({ banners }: { banners?: Banner[] }) {
  const items = (banners ?? []).filter((b) => mediaUrl(b.app_banner_image_path, b.app_banner_image));
  if (!items.length) return null;

  return (
    <section className="container-x mt-4">
      <div className="scrollbar-hide flex snap-x snap-mandatory gap-4 overflow-x-auto">
        {items.map((b, i) => {
          const src = mediaUrl(b.app_banner_image_path, b.app_banner_image);
          const media = (
            <div className="relative aspect-[16/7] w-full overflow-hidden rounded-card bg-surface sm:aspect-[16/5]">
              <Image
                src={src}
                alt={b.title || 'Banner'}
                fill
                sizes="100vw"
                className="object-cover"
                priority={i === 0}
              />
            </div>
          );
          const linkable = b.url && b.url !== '#';
          return linkable ? (
            <a key={String(b.banner_id)} href={b.url} className="w-full shrink-0 snap-start">
              {media}
            </a>
          ) : (
            <div key={String(b.banner_id)} className="w-full shrink-0 snap-start">
              {media}
            </div>
          );
        })}
      </div>
    </section>
  );
}
