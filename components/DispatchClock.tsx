'use client';

import { useEffect, useState } from 'react';
import { bench } from '@/lib/config';

/**
 * Live "ships today" cut-off, computed in IST regardless of the viewer's timezone. Turns the
 * technician's deepest fear — a delayed repair — into honest urgency. Cut-off is business policy
 * (lib/config.ts), not product data.
 */
function istParts() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour12: false,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return { wd: get('weekday'), h: +get('hour'), m: +get('minute'), s: +get('second') };
}

export function DispatchClock() {
  const [state, setState] = useState<{ open: boolean; hms: string } | null>(null);

  useEffect(() => {
    const tick = () => {
      const { wd, h, m, s } = istParts();
      const isWorkingDay = bench.dispatchDays.includes(wd);
      const secsNow = h * 3600 + m * 60 + s;
      const cutoff = bench.dispatchCutoffHour * 3600;
      const remaining = cutoff - secsNow;
      if (isWorkingDay && remaining > 0) {
        const hh = Math.floor(remaining / 3600);
        const mm = Math.floor((remaining % 3600) / 60);
        const ss = remaining % 60;
        const pad = (n: number) => String(n).padStart(2, '0');
        setState({ open: true, hms: `${pad(hh)}:${pad(mm)}:${pad(ss)}` });
      } else {
        setState({ open: false, hms: '' });
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Avoid hydration flash: render a stable shell until the client clock resolves.
  const open = state?.open ?? true;

  return (
    <div className="container-x mt-4">
      <div className="flex items-center gap-2.5 rounded-xl border border-signal/35 bg-signal-soft/60 px-3.5 py-2.5 text-[13px] text-signal dark:bg-signal/10">
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal opacity-60 motion-reduce:hidden" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-signal" />
        </span>
        {open ? (
          <span className="text-signal">
            Order within{' '}
            <span className="font-mono font-bold tabular-nums">{state?.hms ?? '—:—:—'}</span> → ships
            today from {bench.dispatchCity}
          </span>
        ) : (
          <span className="text-signal">Ordered now → ships next working day from {bench.dispatchCity}</span>
        )}
      </div>
    </div>
  );
}
