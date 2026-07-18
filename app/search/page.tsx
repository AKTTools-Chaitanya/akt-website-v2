import type { Metadata } from 'next';
import { CatalogView } from '@/components/CatalogView';
import { searchProducts, sortFromKey } from '@/lib/search';
import { parseCatalogParams, buildFilter } from '@/lib/query';

type SP = Record<string, string | string[] | undefined>;

export function generateMetadata({ searchParams }: { searchParams: SP }): Metadata {
  const q = (Array.isArray(searchParams.q) ? searchParams.q[0] : searchParams.q) || '';
  return { title: q ? `Search: ${q}` : 'Search', robots: { index: false, follow: true } };
}

export default async function SearchPage({ searchParams }: { searchParams: SP }) {
  const params = parseCatalogParams(searchParams);
  const result = await searchProducts({
    q: params.q,
    page: params.page,
    filter: buildFilter(undefined, params),
    sort: sortFromKey(params.sort),
    facets: ['brand_name', 'cat_name', 'in_stock'],
  });

  const heading = params.q ? `Results for “${params.q}”` : 'All products';

  return (
    <CatalogView
      heading={heading}
      result={result}
      basePath="/search"
      params={params}
      showBrandFacet
    />
  );
}
