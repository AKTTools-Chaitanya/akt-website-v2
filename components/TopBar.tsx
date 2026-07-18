'use client';

import { useEffect, useState } from 'react';
import { bench } from '@/lib/config';

/**
 * Slim dark dispatch bar — live "ships today" countdown (IST) + quick trade links. Sets a
 * professional, urgent tone the moment the page loads.
 */
function istNow() {
  const p = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata', hour12: false, weekday: 'short',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(new Date());
  const g = (t: string) => p.find((x) => x.type === t)?.value ?? '';
  return { wd: g('weekday'), h: +g('hour'), m: +g('minute'), s: +g('second') };
}

export function TopBar() {
  const [hms, setHms] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => {
      const { wd, h, m, s } = istNow();
      const rem = bench.dispatchCutoffHour * 3600 - (h * 3600 + m * 60 + s);
      if (bench.dispatchDays.includes(wd) && rem > 0) {
        const pad = (n: number) => String(n).padStart(2, '0');
        setHms(`${pad(Math.floor(rem / 3600))}:${pad(Math.floor((rem % 3600) / 60))}:${pad(rem % 60)}`);
      } else {
        setHms(null);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="bg-ink text-white">
      <div className="container-x flex h-9 items-center justify-between gap-4 text-[12px]">
        <p className="flex items-center gap-2 truncate">
          <ClockIcon className="h-3.5 w-3.5 text-brand-400" />
          {hms ? (
            <>
              <span className="hidden sm:inline text-white/70">Order within</span>
              <span className="font-mono font-semibold tabular-nums text-brand-400">{hms}</span>
              <span className="text-white/70">→</span>
              <span className="font-medium">Ships today from {bench.dispatchCity}</span>
            </>
          ) : (
            <span className="font-medium">Same-day dispatch from {bench.dispatchCity} on working days</span>
          )}
        </p>
        <nav className="hidden shrink-0 items-center gap-5 text-white/75 sm:flex">
          <a href="/account/orders" className="transition hover:text-white">Track Order</a>
          <a href="tel:+919640057000" className="transition hover:text-white">Expert Support</a>
          <a href="/stores" className="transition hover:text-white">Store Locator</a>
        </nav>
      </div>
    </div>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
    </svg>
  );
}
