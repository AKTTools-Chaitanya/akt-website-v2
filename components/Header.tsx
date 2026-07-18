import Link from 'next/link';
import Image from 'next/image';
import { CartCount } from './CartCount';

/**
 * Reference-style header: logo + tagline, a prominent search with a red action button, labelled
 * account/wishlist, live cart, and a category nav row. White, sticky, confident.
 */
const NAV = [
  { label: 'Brands', href: '/search' },
  { label: 'Best Sellers', href: '/search?sort=discount' },
  { label: 'New Arrivals', href: '/search?sort=newest' },
  { label: "Today's Deals", href: '/search?sort=discount' },
  { label: 'Bulk Orders', href: '/account/orders' },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-surface-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/85">
      {/* main bar */}
      <div className="container-x flex items-center gap-3 py-3 sm:gap-6">
        <Link href="/" className="shrink-0" aria-label="AKTTOOLS home">
          <Image src="/akt-logo.png" alt="AKTTOOLS — Akinfo Tools Private Limited" width={84} height={50} priority className="h-11 w-auto sm:h-12" />
        </Link>

        <form action="/search" className="relative hidden min-w-0 flex-1 sm:block">
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input
            name="q"
            type="search"
            autoComplete="off"
            placeholder="Search tools, parts or brands…"
            aria-label="Search products"
            className="w-full rounded-xl border border-surface-border bg-surface-alt py-3 pl-11 pr-28 text-sm text-ink outline-none transition placeholder:text-ink-muted focus:border-brand focus:bg-surface"
          />
          <button type="submit" className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700">
            Search
          </button>
        </form>

        <nav className="flex shrink-0 items-center gap-1 sm:gap-2">
          <IconLink href="/account" label="Account" icon={<UserIcon className="h-5 w-5" />} />
          <IconLink href="/wishlist" label="Wishlist" icon={<HeartIcon className="h-5 w-5" />} />
          <CartCount />
        </nav>
      </div>

      {/* mobile search */}
      <div className="container-x pb-3 sm:hidden">
        <form action="/search" className="relative">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input name="q" type="search" autoComplete="off" placeholder="Search tools, parts or brands…" aria-label="Search products"
            className="w-full rounded-xl border border-surface-border bg-surface-alt py-3 pl-10 pr-4 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-brand focus:bg-surface" />
        </form>
      </div>

      {/* category nav row */}
      <div className="border-t border-surface-border/70 bg-surface">
        <div className="container-x scrollbar-hide flex items-center gap-5 overflow-x-auto py-2.5 text-[13px]">
          <Link href="/search" className="flex shrink-0 items-center gap-2 font-semibold text-ink">
            <MenuIcon className="h-4 w-4 text-brand" /> Shop by Category
          </Link>
          {NAV.map((n) => (
            <Link key={n.label} href={n.href} className="shrink-0 whitespace-nowrap text-ink-soft transition hover:text-brand">
              {n.label}
            </Link>
          ))}
          <Link href="/search?sort=discount" className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-ink-soft transition hover:text-brand">
            Offers <span className="rounded-full bg-signal/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-signal">New</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

function IconLink({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <Link href={href} aria-label={label} className="flex flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-ink-soft transition hover:text-brand">
      {icon}
      <span className="hidden text-[10px] font-medium sm:block">{label}</span>
    </Link>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>);
}
function UserIcon({ className }: { className?: string }) {
  return (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 4-6 8-6s8 2 8 6" /></svg>);
}
function HeartIcon({ className }: { className?: string }) {
  return (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden><path d="M20.8 6.6a5 5 0 0 0-8.8-2.2A5 5 0 0 0 3.2 6.6c0 4.4 8.8 10 8.8 10s8.8-5.6 8.8-10Z" /></svg>);
}
function MenuIcon({ className }: { className?: string }) {
  return (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M4 7h16M4 12h16M4 17h16" /></svg>);
}
