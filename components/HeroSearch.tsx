import Link from 'next/link';

/** Search-first hero — the primary job is to find/reorder a part fast. Calm, sentence case. */
const EXAMPLES = ['iPhone 15 screen', 'Qianli', 'cutting wire', 'hot air station'];

export function HeroSearch() {
  return (
    <section className="container-x pt-6">
      <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
        What do you need for the bench today?
      </h1>
      <p className="mt-2 text-[15px] text-ink-soft">
        Genuine tools & spare parts from 24+ brands — shipped same-day across India.
      </p>
      <form action="/search" className="relative mt-5 max-w-3xl">
        <svg
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-muted"
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
        >
          <circle cx="11" cy="11" r="7" /><path d="m21 21-4.2-4.2" />
        </svg>
        <input
          name="q"
          type="search"
          autoComplete="off"
          placeholder="Search part, model or brand…"
          aria-label="Search products"
          className="w-full rounded-2xl border border-surface-border bg-surface py-4 pl-12 pr-4 text-base text-ink shadow-card outline-none transition placeholder:text-ink-muted focus:border-brand focus:ring-4 focus:ring-brand/10"
        />
      </form>
      <div className="mt-3 flex flex-wrap gap-2">
        {EXAMPLES.map((e) => (
          <Link
            key={e}
            href={`/search?q=${encodeURIComponent(e)}`}
            className="rounded-full border border-surface-border bg-surface px-3.5 py-1.5 text-[13px] text-ink-soft transition hover:border-brand hover:text-brand"
          >
            {e}
          </Link>
        ))}
      </div>
    </section>
  );
}
