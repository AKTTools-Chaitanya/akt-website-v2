import Link from 'next/link';
import Image from 'next/image';

/**
 * Hero — search-first, compact. DESKTOP: the workbench banner sits behind, text/search overlaid on
 * the cream left. MOBILE: clean text-only single column (no banner — the landscape image would crop
 * badly). Warm ground, black type, one red; a metric strip signals scale at a glance.
 */
const TRENDING = ['iPhone 15 screen', 'Hot air station', 'Qianli', 'Charging IC'];
const TRUST = ['Genuine parts', 'Same-day dispatch', 'GST invoice'];

export function HeroBanner() {
  return (
    <section className="container-x pt-4 sm:pt-6">
      <div className="relative overflow-hidden rounded-3xl border border-surface-border bg-gradient-to-br from-[#FDF8F1] via-[#FBF3E9] to-[#F6ECDD] shadow-sm">
        {/* workbench banner — desktop only, behind the copy */}
        <div className="absolute inset-0">
          <Image src="/hero-bench.png" alt="AKT repair workbench — microscope, rework station and precision tools" fill priority sizes="(max-width:1024px) 100vw, 1280px" className="object-cover object-right" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#FBF7F1] via-[#FBF7F1]/62 to-[#FBF7F1]/15 lg:via-[#FBF7F1]/80 lg:to-transparent" />
        </div>

        <div className="relative min-h-[320px] p-5 sm:p-10 lg:flex lg:min-h-[440px] lg:items-center lg:p-12">
          <div className="max-w-lg">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/[0.06] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-brand">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" /> India&rsquo;s largest repair-tools store
            </span>

            <h1 className="mt-3.5 font-display text-[2rem] font-extrabold leading-[1.05] tracking-tight text-ink sm:text-[clamp(2.25rem,3.4vw,3.25rem)] sm:leading-[1.03]">
              Every part for every <span className="text-brand">repair.</span>
            </h1>

            <p className="mt-3 hidden max-w-md text-[14px] leading-relaxed text-ink-soft sm:mt-4 sm:text-[15.5px] lg:block">
              Search 8,846 genuine tools &amp; spares from 100+ brands — same-day dispatch, GST invoice on every order.
            </p>

            <form action="/search" className="relative mt-5 max-w-lg sm:mt-6">
              <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-muted" />
              <input
                name="q"
                type="search"
                autoComplete="off"
                aria-label="Search products"
                placeholder="Search &ldquo;iPhone 15 screen&rdquo;…"
                className="w-full rounded-2xl border border-surface-border bg-surface py-3.5 pl-12 pr-24 text-[15px] text-ink shadow-card outline-none transition placeholder:text-ink-muted focus:border-brand focus:ring-4 focus:ring-brand/10 sm:py-4 sm:text-base"
              />
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-brand px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-brand-700 sm:px-5 sm:text-sm">
                Search
              </button>
            </form>

            <div className="mt-3 hidden flex-wrap gap-2 sm:mt-4 lg:flex">
              {TRENDING.map((t) => (
                <Link key={t} href={`/search?q=${encodeURIComponent(t)}`} className="rounded-full border border-surface-border bg-surface/70 px-3 py-1.5 text-[12.5px] text-ink-soft transition hover:border-brand hover:text-brand">
                  {t}
                </Link>
              ))}
            </div>

            <div className="mt-7 hidden flex-wrap items-center gap-x-3 gap-y-1 text-[14px] font-medium text-ink lg:flex">
              {TRUST.map((t, i) => (
                <span key={t} className="flex items-center gap-3">
                  {i > 0 && <span className="text-ink-muted" aria-hidden>·</span>}
                  {t}
                </span>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <circle cx="11" cy="11" r="7" /><path d="m21 21-4.2-4.2" />
    </svg>
  );
}
