import Link from 'next/link';
import Image from 'next/image';
import { CartCount } from './CartCount';

/**
 * White, logo-forward command bar with a red brand spine. The registered AKT logo owns the
 * top-left with clear space; search is central; account + live cart on the right.
 */
export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-surface-border bg-surface/90 backdrop-blur supports-[backdrop-filter]:bg-surface/75">
      <div className="container-x flex items-center gap-3 py-2.5 sm:gap-6">
        <Link href="/" className="shrink-0" aria-label="AKTTOOLS home">
          <Image src="/akt-logo.png" alt="AKTTOOLS — Akinfo Tools Private Limited" width={81} height={48} priority className="h-11 w-auto" />
        </Link>

        <form action="/search" className="relative min-w-0 flex-1">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input
            name="q"
            type="search"
            autoComplete="off"
            placeholder="Search part, model or brand…"
            aria-label="Search products"
            className="w-full rounded-full border-[1.5px] border-surface-border bg-surface-alt py-2.5 pl-10 pr-4 text-sm text-ink outline-none transition placeholder:text-ink-muted focus:border-brand focus:bg-surface"
          />
        </form>

        <nav className="flex shrink-0 items-center gap-1 text-ink sm:gap-1.5">
          <IconLink href="/account" label="Account">
            <UserIcon className="h-5 w-5" />
          </IconLink>
          <IconLink href="/wishlist" label="Wishlist">
            <HeartIcon className="h-5 w-5" />
          </IconLink>
          <CartCount />
        </nav>
      </div>
    </header>
  );
}

function IconLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-full text-ink-soft transition hover:bg-surface-alt hover:text-brand"
    >
      {children}
    </Link>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
    </svg>
  );
}
function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  );
}
function HeartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20.8 6.6a5 5 0 0 0-8.8-2.2A5 5 0 0 0 3.2 6.6c0 4.4 8.8 10 8.8 10s8.8-5.6 8.8-10Z" />
    </svg>
  );
}
