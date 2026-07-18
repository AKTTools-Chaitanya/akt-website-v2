import Link from 'next/link';
import { ProductGrid } from './ProductGrid';
import { Pagination } from './Pagination';
import { SortSelect } from './SortSelect';
import { catalogHref, toggleBrand, type CatalogParams } from '@/lib/query';
import type { SearchResult } from '@/lib/search';
import type { Crumb } from '@/lib/catalog';

/** Shared body for both /search and /product-category/* — grid + facets + sort + pagination. */
export function CatalogView({
  heading,
  crumbs,
  result,
  basePath,
  params,
  showBrandFacet = true,
}: {
  heading: string;
  crumbs?: Crumb[];
  result: SearchResult;
  basePath: string;
  params: CatalogParams;
  showBrandFacet?: boolean;
}) {
  const brandDist = result.facets.brand_name ?? {};
  const brandEntries = Object.entries(brandDist).sort((a, b) => b[1] - a[1]);
  const filtersActive = params.brands.length > 0 || params.instock;

  return (
    <div className="container-x py-6">
      {crumbs && crumbs.length > 0 && (
        <nav className="mb-3 flex flex-wrap items-center gap-1.5 text-xs text-ink-muted" aria-label="Breadcrumb">
          {crumbs.map((c, i) => (
            <span key={c.href} className="flex items-center gap-1.5">
              {i > 0 && <span>/</span>}
              {i === crumbs.length - 1 ? (
                <span className="text-ink-soft">{c.label}</span>
              ) : (
                <Link href={c.href} className="hover:text-brand-700">
                  {c.label}
                </Link>
              )}
            </span>
          ))}
        </nav>
      )}

      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{heading}</h1>
        <span className="text-sm text-ink-muted">{result.total.toLocaleString('en-IN')} products</span>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr] lg:gap-8">
        {/* Filters */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">Filters</h2>
            {filtersActive && (
              <Link
                href={catalogHref(basePath, params, { brands: [], instock: false, page: 1 })}
                className="text-xs font-medium text-brand-700 hover:underline"
              >
                Clear all
              </Link>
            )}
          </div>

          <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-ink-soft">
            <Link
              href={catalogHref(basePath, params, { instock: !params.instock, page: 1 })}
              className={
                'flex h-5 w-5 items-center justify-center rounded border transition ' +
                (params.instock ? 'border-brand bg-brand text-white' : 'border-surface-border bg-surface')
              }
              aria-pressed={params.instock}
            >
              {params.instock ? '✓' : ''}
            </Link>
            In stock only
          </label>

          {showBrandFacet && brandEntries.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-ink">Brand</h3>
              <ul className="mt-3 space-y-1.5">
                {brandEntries.slice(0, 12).map(([name, count]) => {
                  const active = params.brands.includes(name);
                  return (
                    <li key={name}>
                      <Link
                        href={catalogHref(basePath, toggleBrand(params, name), {})}
                        className="flex items-center gap-2 text-sm text-ink-soft hover:text-ink"
                      >
                        <span
                          className={
                            'flex h-4 w-4 items-center justify-center rounded border text-[10px] transition ' +
                            (active ? 'border-brand bg-brand text-white' : 'border-surface-border')
                          }
                        >
                          {active ? '✓' : ''}
                        </span>
                        <span className="flex-1 truncate">{name}</span>
                        <span className="text-xs text-ink-muted">{count}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </aside>

        {/* Results */}
        <div>
          <div className="mb-4 flex items-center justify-end">
            <SortSelect basePath={basePath} params={params} />
          </div>

          {result.hits.length > 0 ? (
            <ProductGrid products={result.hits} />
          ) : (
            <div className="rounded-card border border-surface-border bg-surface py-20 text-center">
              <p className="text-ink-soft">No products found.</p>
              {filtersActive && (
                <Link
                  href={catalogHref(basePath, params, { brands: [], instock: false, page: 1 })}
                  className="mt-2 inline-block text-sm font-medium text-brand-700 hover:underline"
                >
                  Clear filters
                </Link>
              )}
            </div>
          )}

          <Pagination basePath={basePath} params={params} totalPages={result.totalPages} />
        </div>
      </div>
    </div>
  );
}
