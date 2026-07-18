import { getHome } from '@/lib/api';
import { searchProducts } from '@/lib/search';
import { priceView, inStock } from '@/lib/price';
import type { Product } from '@/lib/types';
import { HeroBanner } from '@/components/HeroBanner';
import { BrandRibbon } from '@/components/BrandRibbon';
import { PopularSearches } from '@/components/PopularSearches';
import { CategoryShowcase } from '@/components/CategoryShowcase';
import { ProductRail } from '@/components/ProductRail';
import { WhyChoose } from '@/components/WhyChoose';
import { Newsletter } from '@/components/Newsletter';
import { WhatsAppBar } from '@/components/WhatsAppBar';

// Homepage — warm, red-forward, photography-rich (reference language). Real data throughout.
export const revalidate = 120;

const dedupe = (arr: Product[]) => {
  const seen = new Set<string>();
  return arr.filter((p) => {
    const k = String(p.pro_id);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};

export default async function Home() {
  // Built in CI without live services → degrade to empty; real data fills at runtime (ISR).
  const emptyRail = { hits: [], total: 0, page: 1, totalPages: 1, facets: {}, query: '' };
  const [home, discounts, justAdded] = await Promise.all([
    getHome().catch(() => null),
    searchProducts({ q: '', filter: 'in_stock = true', sort: ['discount_pct:desc'], hitsPerPage: 16, facets: [] }).catch(() => emptyRail),
    searchProducts({ q: '', filter: 'in_stock = true', sort: ['created_ts:desc'], hitsPerPage: 12, facets: [] }).catch(() => emptyRail),
  ]);

  // Surface substantial products (equipment photographs premium) for the hero + best-sellers.
  const pool = dedupe([
    ...(home?.trending_products ?? []),
    ...(home?.deal_products ?? []),
    ...(home?.special_offer_products ?? []),
    ...discounts.hits,
  ]).filter(inStock);
  const byPrice = [...pool].sort((a, b) => priceView(b).price - priceView(a).price);
  const bestSellers = byPrice.slice(0, 10);

  const bestBadge = (p: Product, i: number) =>
    i === 0 ? { label: 'Best seller', tone: 'brand' as const } : inStock(p) ? { label: 'Ships today', tone: 'green' as const } : undefined;

  return (
    <>
      <HeroBanner />
      <BrandRibbon brands={home?.popular_brands} />
      <PopularSearches />
      <CategoryShowcase categories={home?.trending_categories} />
      <ProductRail title="Best sellers" products={bestSellers} viewAllHref="/search?sort=discount" getBadge={bestBadge} />
      <ProductRail title="New arrivals" products={justAdded.hits} viewAllHref="/search?sort=newest" getBadge={() => ({ label: 'New', tone: 'ink' })} />
      <WhyChoose />
      <Newsletter />
      <WhatsAppBar />
    </>
  );
}
