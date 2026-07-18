/** Parse/serialize catalog listing & search URL params, and assemble Meili filters. */

export interface CatalogParams {
  q: string;
  brands: string[]; // brand_name values (multi-select)
  instock: boolean;
  sort: string; // SORT_OPTIONS key
  page: number;
}

type SP = Record<string, string | string[] | undefined>;

export function parseCatalogParams(sp: SP): CatalogParams {
  const one = (k: string) => {
    const v = sp[k];
    return (Array.isArray(v) ? v[0] : v) ?? '';
  };
  const brandRaw = one('brand');
  return {
    q: one('q'),
    brands: brandRaw ? brandRaw.split(',').filter(Boolean) : [],
    instock: one('instock') === '1',
    sort: one('sort') || 'relevance',
    page: Math.max(1, parseInt(one('page') || '1', 10) || 1),
  };
}

/** Build the Meili filter array from a base filter (category/brand page) + active facets. */
export function buildFilter(base: string | undefined, p: CatalogParams): string[] {
  const parts: string[] = [];
  if (base) parts.push(base);
  if (p.brands.length) {
    parts.push('(' + p.brands.map((b) => `brand_name = "${b.replace(/"/g, '')}"`).join(' OR ') + ')');
  }
  if (p.instock) parts.push('in_stock = true');
  return parts;
}

export function catalogHref(basePath: string, p: CatalogParams, changes: Partial<CatalogParams>): string {
  const m = { ...p, ...changes };
  const usp = new URLSearchParams();
  if (m.q) usp.set('q', m.q);
  if (m.brands.length) usp.set('brand', m.brands.join(','));
  if (m.instock) usp.set('instock', '1');
  if (m.sort && m.sort !== 'relevance') usp.set('sort', m.sort);
  if (m.page > 1) usp.set('page', String(m.page));
  const qs = usp.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

/** Toggle a brand facet value and reset to page 1. */
export function toggleBrand(p: CatalogParams, brand: string): CatalogParams {
  const has = p.brands.includes(brand);
  return { ...p, brands: has ? p.brands.filter((b) => b !== brand) : [...p.brands, brand], page: 1 };
}
