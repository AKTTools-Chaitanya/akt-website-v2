import { MeiliSearch } from 'meilisearch';
import type { Product } from './types';

/**
 * Meilisearch powers V2 search AND category/brand listing (listing = a filtered search).
 * The PHP react-api is never touched — a read-only indexer (scripts/reindex.mjs) mirrors the
 * catalog into Meili. Queries run server-side (SSR), so the admin/search keys never hit the browser.
 */
export const PRODUCTS_INDEX = 'products';

const HOST = process.env.MEILI_HOST ?? 'http://127.0.0.1:7700';

export function meiliClient(admin = false): MeiliSearch {
  const apiKey = admin
    ? process.env.MEILI_ADMIN_KEY
    : process.env.MEILI_SEARCH_KEY ?? process.env.MEILI_ADMIN_KEY;
  return new MeiliSearch({ host: HOST, apiKey });
}

/**
 * A Meili product document. Keeps the raw `pro_*` fields so <ProductCard> renders unchanged,
 * plus normalized fields (price/in_stock/slugs) for filtering, faceting and sorting.
 */
export interface ProductDoc extends Product {
  id: number;
  brand_name?: string;
  brand_slug?: string;
  cat_name?: string;
  cat_slug?: string;
  scat_name?: string;
  scat_slug?: string;
  price: number;
  mrp: number;
  discount_pct: number;
  in_stock: boolean;
  created_ts: number;
}

export interface SearchArgs {
  q?: string;
  page?: number;
  hitsPerPage?: number;
  filter?: string | string[];
  sort?: string[];
  facets?: string[];
}

export interface SearchResult {
  hits: ProductDoc[];
  total: number;
  page: number;
  totalPages: number;
  facets: Record<string, Record<string, number>>;
  query: string;
}

export const DEFAULT_FACETS = ['brand_name', 'cat_name', 'in_stock'];

/** Sort options exposed in the UI → Meili sort expressions. */
export const SORT_OPTIONS: { key: string; label: string; sort?: string[] }[] = [
  { key: 'relevance', label: 'Relevance' },
  { key: 'lowtohigh', label: 'Price: Low to High', sort: ['price:asc'] },
  { key: 'hightolow', label: 'Price: High to Low', sort: ['price:desc'] },
  { key: 'discount', label: 'Discount', sort: ['discount_pct:desc'] },
  { key: 'newest', label: 'Newest', sort: ['created_ts:desc'] },
];

export async function searchProducts(args: SearchArgs): Promise<SearchResult> {
  const index = meiliClient().index<ProductDoc>(PRODUCTS_INDEX);
  const res = await index.search(args.q ?? '', {
    page: args.page ?? 1,
    hitsPerPage: args.hitsPerPage ?? 24,
    filter: args.filter,
    sort: args.sort,
    facets: args.facets ?? DEFAULT_FACETS,
  });
  return {
    hits: res.hits as ProductDoc[],
    total: (res as any).totalHits ?? res.hits.length,
    page: (res as any).page ?? 1,
    totalPages: (res as any).totalPages ?? 1,
    facets: (res as any).facetDistribution ?? {},
    query: args.q ?? '',
  };
}

export function sortFromKey(key?: string): string[] | undefined {
  return SORT_OPTIONS.find((o) => o.key === key)?.sort;
}

/** A product shaped for the Google Merchant feed (only the attributes the feed needs). */
export interface FeedProduct {
  pro_id: number | string;
  pro_name: string;
  pro_url: string;
  pro_image: string;
  pro_short_description?: string;
  pro_description?: string;
  price: number;
  mrp: number;
  discount_pct: number;
  in_stock: boolean;
  brand_name?: string;
  cat_name?: string;
}

/** All products (feed fields) from the Meili index — powers the Google Shopping feed. */
export async function getAllProductsForFeed(): Promise<FeedProduct[]> {
  const index = meiliClient().index<ProductDoc>(PRODUCTS_INDEX);
  const fields = [
    'pro_id', 'pro_name', 'pro_url', 'pro_image', 'pro_short_description', 'pro_description',
    'price', 'mrp', 'discount_pct', 'in_stock', 'brand_name', 'cat_name',
  ];
  const out: FeedProduct[] = [];
  const limit = 1000;
  for (let offset = 0; offset < 50000; offset += limit) {
    const res: any = await index.getDocuments({ fields, limit, offset });
    const rows: any[] = res.results ?? res ?? [];
    for (const r of rows) if (r.pro_url && r.pro_name) out.push(r as FeedProduct);
    if (rows.length < limit) break;
  }
  return out;
}

/** All product slugs from the Meili index — feeds the XML sitemap. Paged for large catalogs. */
export async function getAllProductSlugs(): Promise<string[]> {
  const index = meiliClient().index<ProductDoc>(PRODUCTS_INDEX);
  const out: string[] = [];
  const limit = 1000;
  for (let offset = 0; offset < 50000; offset += limit) {
    const res: any = await index.getDocuments({ fields: ['pro_url'], limit, offset });
    const rows: ProductDoc[] = res.results ?? res ?? [];
    for (const r of rows) if (r.pro_url) out.push(r.pro_url);
    if (rows.length < limit) break;
  }
  return out;
}
