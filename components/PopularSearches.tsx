import Link from 'next/link';

/** Popular searches — seeds intent and teaches the search-first habit. */
const TERMS = ['iPhone 15 Screen', 'Qianli Tools', 'Hot Air Station', 'Microscope', 'PCB Holder', 'Charging IC', 'Solder Wire', 'BGA Rework'];

export function PopularSearches() {
  return (
    <section className="container-x mt-8">
      <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-muted">Popular searches</div>
      <div className="scrollbar-hide flex gap-2.5 overflow-x-auto pb-1">
        {TERMS.map((t) => (
          <Link
            key={t}
            href={`/search?q=${encodeURIComponent(t)}`}
            className="flex shrink-0 items-center gap-2 rounded-full border border-surface-border bg-surface px-4 py-2 text-[13px] font-medium text-ink-soft transition hover:border-brand hover:text-brand"
          >
            <svg className="h-3.5 w-3.5 text-ink-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
            {t}
          </Link>
        ))}
      </div>
    </section>
  );
}
