import type { MetadataRoute } from 'next';
import { config, productUrl, categoryUrl, brandUrl } from '@/lib/config';
import { absoluteUrl } from '@/lib/seo';
import { getAllProductSlugs } from '@/lib/search';
import { getBrands, getCategoriesMeta } from '@/lib/catalog';

// Rebuild hourly (ISR) so new products enter the sitemap without a redeploy.
export const revalidate = 3600;

/**
 * Dynamic XML sitemap generated from live data (Meili product slugs + category/brand taxonomy).
 * Next serves it at /sitemap.xml. For a catalog this size it stays well under the 50k-URL limit;
 * if products exceed ~45k we'll split via generateSitemaps().
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const [slugs, cats, brands] = await Promise.all([
    getAllProductSlugs().catch(() => [] as string[]),
    getCategoriesMeta().catch(() => []),
    getBrands().catch(() => []),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/'), lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: absoluteUrl('/search'), lastModified: now, changeFrequency: 'weekly', priority: 0.5 },
  ];

  const categoryPages: MetadataRoute.Sitemap = cats.map((c) => ({
    url: absoluteUrl(categoryUrl(c.slug)),
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const brandPages: MetadataRoute.Sitemap = brands.map((b) => ({
    url: absoluteUrl(brandUrl(b.slug)),
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  const productPages: MetadataRoute.Sitemap = slugs.map((slug) => ({
    url: absoluteUrl(productUrl(slug)),
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [...staticPages, ...categoryPages, ...brandPages, ...productPages];
}
