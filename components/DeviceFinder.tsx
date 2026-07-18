import Link from 'next/link';

/**
 * "What are you fixing?" — the repair-trade way to navigate. Today these map to search
 * queries (honest approximation); a curated device→part finder is a future data-tagging project.
 */
const DEVICES: { label: string; sub: string; q: string }[] = [
  { label: 'Apple', sub: 'iPhone · iPad', q: 'iphone' },
  { label: 'Samsung', sub: 'S · A · Fold', q: 'samsung' },
  { label: 'Xiaomi', sub: 'Redmi · Poco', q: 'redmi' },
  { label: 'Oppo', sub: 'Reno · F', q: 'oppo' },
  { label: 'Vivo', sub: 'Y · V · X', q: 'vivo' },
  { label: 'Realme', sub: 'C · GT', q: 'realme' },
];

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="6" y="2.5" width="12" height="19" rx="2.5" />
      <path d="M10.5 18.5h3" />
    </svg>
  );
}

export function DeviceFinder() {
  return (
    <section className="container-x mt-10">
      <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">What are you fixing?</h2>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {DEVICES.map((d) => (
          <Link
            key={d.label}
            href={`/search?q=${encodeURIComponent(d.q)}`}
            className="flex items-center gap-3 rounded-2xl border border-surface-border bg-surface p-4 transition hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-hover"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-alt text-ink-soft">
              <PhoneIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <div className="text-[15px] font-semibold leading-tight text-ink">{d.label}</div>
              <div className="mt-0.5 truncate text-[11.5px] text-ink-muted">{d.sub}</div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
