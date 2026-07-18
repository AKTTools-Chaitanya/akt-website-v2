import Link from 'next/link';

/**
 * The Reorder hero — the concept's centerpiece. Backend is real (`api-my-orders`/`api-reorder`),
 * but it needs the auth bridge (P5/P6). Until then this slot is an honest sign-in prompt that
 * previews the value, rather than faking a reorder list.
 */
export function ReorderTeaser() {
  return (
    <section className="container-x mt-8">
      <div className="overflow-hidden rounded-2xl border border-brand/25 bg-gradient-to-br from-brand/[0.08] to-transparent">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-brand">
                Reorder
              </span>
            </div>
            <h2 className="mt-1.5 text-lg font-semibold tracking-tight text-ink">
              Restock your bench in one tap
            </h2>
            <p className="mt-1 max-w-md text-sm text-ink-soft">
              Sign in to see the consumables you buy on repeat — with a “due to reorder” nudge and
              one-tap “rebuild last order.”
            </p>
          </div>
          <Link
            href="/account"
            className="inline-flex shrink-0 items-center justify-center rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white shadow-card transition hover:bg-brand-700"
          >
            Sign in to restock →
          </Link>
        </div>
      </div>
    </section>
  );
}
