import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { getProductBySlug } from '@/lib/api';
import { priceView, formatINR, firstImage, allImages, inStock } from '@/lib/price';
import { productUrl } from '@/lib/config';
import { buildMetadata, productSchema, breadcrumbSchema } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';

type Params = { params: { slug: string } };

// SSR metadata (title/description/canonical/OG/Twitter/robots) via the shared helper.
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const data = await getProductBySlug(params.slug);
  if (!data) return { title: 'Product not found', robots: { index: false, follow: false } };
  const p = data.product;
  return buildMetadata({
    title: p.pro_name,
    description: (p.pro_short_description || p.pro_name || '').toString().slice(0, 160),
    path: productUrl(p.pro_url),
    images: allImages(p.pro_image).slice(0, 4),
    type: 'product',
  });
}

export default async function ProductPage({ params }: Params) {
  const data = await getProductBySlug(params.slug);
  if (!data) notFound();

  const p = data.product;
  const pv = priceView(p);
  const images = allImages(p.pro_image);
  const main = images[0] ?? '';
  const available = inStock(p);

  // Product + Offer (shipping/returns, reviews-ready) and BreadcrumbList structured data.
  const catName = (p as any).cat as string | undefined;
  const jsonLd = [
    productSchema(p),
    breadcrumbSchema([
      { name: 'Home', url: '/' },
      ...(catName ? [{ name: catName, url: '/search?q=' }] : []),
      { name: p.pro_name, url: productUrl(p.pro_url) },
    ]),
  ];

  return (
    <div className="container-x py-6 lg:py-10">
      <JsonLd data={jsonLd} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Gallery (full gallery UX lands in Phase 4; Phase 1 = main image + thumbs) */}
        <div>
          <div className="relative aspect-square overflow-hidden rounded-card bg-surface shadow-card">
            {main ? (
              <Image
                src={main}
                alt={p.pro_name}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-contain p-4"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center text-ink-muted">No image</div>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {images.slice(0, 6).map((src, i) => (
                <div
                  key={i}
                  className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-surface-border bg-surface"
                >
                  <Image src={src} alt={`${p.pro_name} ${i + 1}`} fill sizes="64px" className="object-contain p-1" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Buy box */}
        <div>
          <h1 className="text-2xl font-semibold leading-snug tracking-tight lg:text-3xl">
            {p.pro_name}
          </h1>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-semibold text-ink">{formatINR(pv.price)}</span>
            {pv.onSale && (
              <>
                <span className="text-lg text-ink-muted line-through">{formatINR(pv.mrp)}</span>
                <span className="rounded-md bg-brand-50 px-2 py-0.5 text-sm font-medium text-brand-700">
                  {pv.discountPct}% off
                </span>
              </>
            )}
          </div>
          <p className="mt-1 text-xs text-ink-muted">Inclusive of all taxes</p>

          <div className="mt-4">
            {available ? (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-success">
                <span className="h-2 w-2 rounded-full bg-success" /> In stock
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-danger">
                <span className="h-2 w-2 rounded-full bg-danger" /> Out of stock
              </span>
            )}
          </div>

          {/* Add-to-cart wiring lands in Phase 5 (reuses api-add-to-cart). Phase 1 = static. */}
          <div className="mt-6 flex gap-3">
            <button
              disabled={!available}
              className="flex-1 rounded-card bg-brand py-3 font-medium text-white shadow-card transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Add to cart
            </button>
            <button className="rounded-card border border-surface-border bg-surface px-5 font-medium text-ink transition hover:shadow-hover">
              ♥
            </button>
          </div>

          {p.sku ? (
            <p className="mt-4 text-sm text-ink-soft">
              SKU: <span className="font-medium">{p.sku}</span>
            </p>
          ) : null}

          {p.pro_description ? (
            <div className="mt-8">
              <h2 className="text-lg font-semibold">Description</h2>
              <div
                className="prose mt-2 max-w-none text-sm text-ink-soft"
                dangerouslySetInnerHTML={{ __html: String(p.pro_description) }}
              />
            </div>
          ) : null}
        </div>
      </div>

      {/* Related products — grid proof (full cards in Phase 3) */}
      {data.related_products?.length > 0 && (
        <section className="mt-14">
          <h2 className="text-xl font-semibold">Related products</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {data.related_products.slice(0, 5).map((rp) => {
              const rpv = priceView(rp);
              const img = firstImage(rp.pro_image);
              return (
                <a
                  key={String(rp.pro_id)}
                  href={productUrl(rp.pro_url)}
                  className="group rounded-card bg-surface p-3 shadow-card transition hover:shadow-hover"
                >
                  <div className="relative aspect-square overflow-hidden rounded-lg bg-surface-alt">
                    {img && (
                      <Image src={img} alt={rp.pro_name} fill sizes="20vw" className="object-contain p-2" />
                    )}
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-ink">{rp.pro_name}</p>
                  <p className="mt-1 text-sm font-semibold">{formatINR(rpv.price)}</p>
                </a>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
