/** Dark "stay updated" band — restock alerts, deals, repair tips. One clear red action. */
export function Newsletter() {
  return (
    <section className="container-x mt-14 sm:mt-20">
      <div className="surface-ink flex flex-col items-start gap-5 rounded-3xl px-6 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-10">
        <div className="relative">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-400">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M4 6h16v12H4z" /><path d="m4 7 8 6 8-6" /></svg>
            Stay updated
          </div>
          <p className="mt-2 max-w-md text-[14px] text-white/70">Get new product alerts, exclusive offers and repair tips. No spam — unsubscribe anytime.</p>
        </div>
        <form className="relative flex w-full gap-2 sm:w-auto sm:min-w-[420px]">
          <input
            type="email"
            required
            placeholder="Enter your email address"
            aria-label="Email address"
            className="min-w-0 flex-1 rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-brand-400"
          />
          <button type="submit" className="shrink-0 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700">
            Subscribe
          </button>
        </form>
      </div>
    </section>
  );
}
