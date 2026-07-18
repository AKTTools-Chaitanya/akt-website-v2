/** Quiet reassurance row — four true facts, clean white cards with a small red-tinted icon. */
const ITEMS: { icon: string; label: string }[] = [
  { icon: '✓', label: '100% genuine brands' },
  { icon: '₹', label: 'GST invoice included' },
  { icon: '⚡', label: 'Same-day dispatch' },
  { icon: '#', label: 'COD · UPI · Cards' },
];

export function TrustStrip() {
  return (
    <section className="container-x mt-8">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {ITEMS.map((it) => (
          <div
            key={it.label}
            className="flex items-center gap-3 rounded-xl border border-surface-border bg-surface px-3.5 py-3"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/[0.07] text-sm font-semibold text-brand">
              {it.icon}
            </span>
            <span className="text-[13.5px] font-medium text-ink">{it.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
