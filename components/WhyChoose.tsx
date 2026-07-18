/** "Why choose AKT" — five reasons, quietly stated on a warm band. Trust the pro buyer weighs. */
const ITEMS = [
  { t: '100% Genuine Products', d: 'Only original & authentic', icon: 'shield' },
  { t: 'Fastest Shipping', d: 'Same-day dispatch from Delhi', icon: 'truck' },
  { t: 'Expert Guidance', d: 'We know repairs inside out', icon: 'award' },
  { t: 'After-Sales Support', d: 'Always here for you', icon: 'chat' },
  { t: 'Trusted by 10,000+', d: 'Professionals across India', icon: 'users' },
] as const;

export function WhyChoose() {
  return (
    <section className="container-x mt-14 sm:mt-20">
      <h2 className="text-center font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Why choose AKT Tools</h2>
      <div className="mt-7 grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
        {ITEMS.map((it) => (
          <div key={it.t} className="flex flex-col items-center gap-3 rounded-2xl border border-surface-border bg-surface px-4 py-6 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/[0.08] text-brand">
              <Icon name={it.icon} />
            </span>
            <div>
              <div className="text-[13.5px] font-semibold text-ink">{it.t}</div>
              <div className="mt-0.5 text-[11.5px] text-ink-muted">{it.d}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Icon({ name }: { name: string }) {
  const c = 'h-5 w-5';
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (name) {
    case 'shield': return (<svg className={c} viewBox="0 0 24 24" {...p}><path d="M12 3 5 6v5c0 4.4 3 8 7 10 4-2 7-5.6 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></svg>);
    case 'truck': return (<svg className={c} viewBox="0 0 24 24" {...p}><path d="M3 6h11v9H3zM14 9h4l3 3v3h-7z" /><circle cx="7" cy="18" r="1.6" /><circle cx="17.5" cy="18" r="1.6" /></svg>);
    case 'award': return (<svg className={c} viewBox="0 0 24 24" {...p}><circle cx="12" cy="9" r="5" /><path d="M9 13.5 7.5 21 12 18l4.5 3L15 13.5" /></svg>);
    case 'chat': return (<svg className={c} viewBox="0 0 24 24" {...p}><path d="M4 5h16v11H9l-4 3v-3H4z" /></svg>);
    case 'users': return (<svg className={c} viewBox="0 0 24 24" {...p}><circle cx="9" cy="8" r="3.2" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0M16 5.2a3.2 3.2 0 0 1 0 6M18 20a5.5 5.5 0 0 0-3-4.9" /></svg>);
    default: return null;
  }
}
