import Link from 'next/link';

/** Mobile-only sticky bottom navigation — one-tap shortcuts to the core destinations. */
const ITEMS = [
  { href: '/', label: 'Home', icon: 'home' },
  { href: '/search', label: 'Categories', icon: 'grid' },
  { href: '/search', label: 'Search', icon: 'search' },
  { href: '/wishlist', label: 'Wishlist', icon: 'heart' },
  { href: '/account', label: 'Account', icon: 'user' },
] as const;

export function BottomNav() {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-surface-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
    >
      <ul className="grid grid-cols-5">
        {ITEMS.map((it) => (
          <li key={it.label}>
            <Link href={it.href} className="flex h-14 flex-col items-center justify-center gap-1 text-ink-soft transition active:text-brand">
              <Icon name={it.icon} />
              <span className="text-[10px] font-medium leading-none">{it.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function Icon({ name }: { name: string }) {
  const c = 'h-[22px] w-[22px]';
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (name) {
    case 'home': return (<svg className={c} viewBox="0 0 24 24" {...p}><path d="M4 11 12 4l8 7M6 10v9h12v-9" /></svg>);
    case 'grid': return (<svg className={c} viewBox="0 0 24 24" {...p}><rect x="4" y="4" width="7" height="7" rx="1.6" /><rect x="13" y="4" width="7" height="7" rx="1.6" /><rect x="4" y="13" width="7" height="7" rx="1.6" /><rect x="13" y="13" width="7" height="7" rx="1.6" /></svg>);
    case 'search': return (<svg className={c} viewBox="0 0 24 24" {...p}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>);
    case 'heart': return (<svg className={c} viewBox="0 0 24 24" {...p}><path d="M20.8 6.6a5 5 0 0 0-8.8-2.2A5 5 0 0 0 3.2 6.6c0 4.4 8.8 10 8.8 10s8.8-5.6 8.8-10Z" /></svg>);
    case 'user': return (<svg className={c} viewBox="0 0 24 24" {...p}><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 4-6 8-6s8 2 8 6" /></svg>);
    default: return null;
  }
}
