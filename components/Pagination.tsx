import Link from 'next/link';
import { catalogHref, type CatalogParams } from '@/lib/query';

/** SSR, link-based pagination (crawlable, no client JS). */
export function Pagination({
  basePath,
  params,
  totalPages,
}: {
  basePath: string;
  params: CatalogParams;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;
  const cur = params.page;

  // A compact window of pages around the current one.
  const pages = new Set<number>([1, totalPages, cur, cur - 1, cur + 1]);
  const list = [...pages].filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b);

  const item = (n: number) => (
    <Link
      key={n}
      href={catalogHref(basePath, params, { page: n })}
      aria-current={n === cur ? 'page' : undefined}
      className={
        'flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm font-medium transition ' +
        (n === cur
          ? 'bg-brand text-white'
          : 'border border-surface-border bg-surface text-ink-soft hover:shadow-hover')
      }
    >
      {n}
    </Link>
  );

  return (
    <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Pagination">
      {cur > 1 && (
        <Link
          href={catalogHref(basePath, params, { page: cur - 1 })}
          className="flex h-9 items-center rounded-lg border border-surface-border bg-surface px-3 text-sm text-ink-soft hover:shadow-hover"
        >
          ← Prev
        </Link>
      )}
      {list.map((n, i) => {
        const prev = list[i - 1];
        return (
          <span key={n} className="flex items-center gap-2">
            {prev && n - prev > 1 && <span className="text-ink-muted">…</span>}
            {item(n)}
          </span>
        );
      })}
      {cur < totalPages && (
        <Link
          href={catalogHref(basePath, params, { page: cur + 1 })}
          className="flex h-9 items-center rounded-lg border border-surface-border bg-surface px-3 text-sm text-ink-soft hover:shadow-hover"
        >
          Next →
        </Link>
      )}
    </nav>
  );
}
