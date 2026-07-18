import { getHome } from '@/lib/api';
import { searchProducts } from '@/lib/search';
import { DispatchClock } from '@/components/DispatchClock';
import { HeroSearch } from '@/components/HeroSearch';
import { CategoryStrip } from '@/components/CategoryStrip';
import { DeviceFinder } from '@/components/DeviceFinder';
import { ReorderTeaser } from '@/components/ReorderTeaser';
import { TrustStrip } from '@/components/TrustStrip';
import { ProductRail } from '@/components/ProductRail';
import { BrandStores } from '@/components/BrandStores';
import { WhatsAppBar } from '@/components/WhatsAppBar';

// "The Bench" — a restocking cockpit, not a store. Every section runs on verified live data;
// Reorder is an honest sign-in teaser until the auth bridge (P5/P6) lands.
export const revalidate = 120;

export default async function Home() {
  // Rails come from real data: discounts + just-added from Meili, popular + brands from api-home.
  const [home, discounts, justAdded] = await Promise.all([
    getHome(),
    searchProducts({ q: '', filter: 'in_stock = true', sort: ['discount_pct:desc'], hitsPerPage: 12, facets: [] }),
    searchProducts({ q: '', filter: 'in_stock = true', sort: ['created_ts:desc'], hitsPerPage: 12, facets: [] }),
  ]);

  return (
    <>
      <DispatchClock />
      <HeroSearch />
      <CategoryStrip categories={home?.trending_categories} />
      {/* Navigation layer: find by device, then by brand — the two ways a technician thinks. */}
      <DeviceFinder />
      <BrandStores brands={home?.popular_brands} />

      <ReorderTeaser />
      <TrustStrip />

      <ProductRail title="Biggest discounts" products={discounts.hits} viewAllHref="/search?sort=discount" />
      <ProductRail title="Just added" products={justAdded.hits} viewAllHref="/search?sort=newest" />
      <ProductRail title="Popular this week" products={home?.trending_products} viewAllHref="/search?q=" />

      <WhatsAppBar />
    </>
  );
}
