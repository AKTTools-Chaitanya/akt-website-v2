import { bench } from '@/lib/config';

/**
 * Concept B — premium trust module. Not an icon row: four plain-stated facts in one connected
 * hairline panel. Answers the professional buyer's real objections (genuine, dispatch, GST, help).
 */
const ITEMS: { t: string; d: string }[] = [
  { t: '100% Genuine', d: 'Verified stock only' },
  { t: 'Same-day Dispatch', d: `Order by ${bench.dispatchCutoffHour % 12 || 12} PM · ${bench.dispatchCity}` },
  { t: 'GST Invoice', d: 'On every order' },
  { t: 'Expert Support', d: 'Technicians on call' },
];

export function TrustStrip() {
  return (
    <section className="container-x mt-12 sm:mt-16">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-surface-border bg-surface-border sm:grid-cols-4">
        {ITEMS.map((it) => (
          <div key={it.t} className="bg-surface px-5 py-5">
            <div className="text-[14px] font-semibold tracking-tight text-ink">{it.t}</div>
            <div className="mt-1 text-[12px] text-ink-soft">{it.d}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
