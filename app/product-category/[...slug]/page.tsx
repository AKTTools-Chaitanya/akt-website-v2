import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CatalogView } from '@/components/CatalogView';
import { resolveListing } from '@/lib/catalog';
import { searchProducts, sortFromKey } from '@/lib/search';
import { parseCatalogParams, buildFilter } from '@/lib/query';
import { config } from '@/lib/config';

type SP = Record<string, string | string[] | undefined>;
type Params = { params: { slug: string[] }; searchParams: SP };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const listing = await resolveListing(params.slug);
  if (!listing) return { title: 'Not found' };
  const path = '/product-category/' + params.slug.join('/');
  return {
    title: listing.seoTitle || listing.name,
    description: listing.seoDescription,
    alternates: { canonical: `${config.siteUrl}${path}` },
  };
}

export default async function CategoryPage({ params, searchParams }: Params) {
  const listing = await resolveListing(params.slug);
  if (!listing) notFound();

  const p = parseCatalogParams(searchParams);
  const basePath = '/product-category/' + params.slug.join('/');
  const isBrand = listing.kind === 'brand';

  const result = await searchProducts({
    q: p.q,
    page: p.page,
    filter: buildFilter(listing.filter, p),
    sort: sortFromKey(p.sort),
    // On a brand page the brand is fixed, so surface category facet instead.
    facets: isBrand ? ['cat_name', 'in_stock'] : ['brand_name', 'in_stock'],
  });

  return (
    <CatalogView
      heading={listing.name}
      crumbs={listing.crumbs}
      result={result}
      basePath={basePath}
      params={p}
      showBrandFacet={!isBrand}
    />
  );
}
