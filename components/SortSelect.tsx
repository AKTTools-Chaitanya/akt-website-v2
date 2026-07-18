'use client';

import { useRouter } from 'next/navigation';
import { SORT_OPTIONS } from '@/lib/search';
import { catalogHref, type CatalogParams } from '@/lib/query';

/** The one interactive control on listing pages — navigates (SSR) on change. */
export function SortSelect({ basePath, params }: { basePath: string; params: CatalogParams }) {
  const router = useRouter();
  return (
    <label className="flex items-center gap-2 text-sm text-ink-soft">
      <span className="hidden sm:inline">Sort</span>
      <select
        value={params.sort}
        onChange={(e) => router.push(catalogHref(basePath, params, { sort: e.target.value, page: 1 }))}
        className="rounded-lg border border-surface-border bg-surface py-2 pl-3 pr-8 text-sm text-ink outline-none transition focus:border-brand"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.key} value={o.key}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
