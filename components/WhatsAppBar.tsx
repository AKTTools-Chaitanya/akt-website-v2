import { bench } from '@/lib/config';

/**
 * WhatsApp is how the Indian repair trade actually communicates — "send a photo of the part."
 * Renders only when AKT has set a number in config (avoids a dead link in production).
 */
export function WhatsAppBar() {
  if (!bench.whatsappNumber) return null;
  const href = `https://wa.me/${bench.whatsappNumber}`;

  return (
    <section className="container-x mt-8">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 rounded-2xl border border-surface-border bg-surface p-4 shadow-card transition hover:shadow-hover"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#25D366]/15 text-xl text-[#1e9e52]">
          ✆
        </span>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-ink">Ask on WhatsApp</div>
          <div className="text-[13px] text-ink-soft">Part not listed? Send a photo and we’ll source it.</div>
        </div>
        <span className="ml-auto font-mono text-xs font-bold text-brand">CHAT →</span>
      </a>
    </section>
  );
}
