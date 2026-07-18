import Link from 'next/link';
import Image from 'next/image';

const COLUMNS: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: 'Shop',
    links: [
      { label: 'All products', href: '/search?q=' },
      { label: 'Brands', href: '/' },
      { label: 'New arrivals', href: '/search?sort=newest' },
      { label: 'Offers', href: '/search?sort=discount' },
    ],
  },
  {
    heading: 'Support',
    links: [
      { label: 'Track order', href: '/account' },
      { label: 'Returns & refunds', href: '/return-policy' },
      { label: 'GST billing', href: '/shipping-payment-policy' },
      { label: 'Contact us', href: '/contact-us' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About us', href: '/about-us' },
      { label: 'Privacy policy', href: '/privacy-policy' },
      { label: 'Terms & conditions', href: '/terms-conditions' },
    ],
  },
];

/** Clean, light footer — the AKT logo, a short line, and utility links. */
export function Footer() {
  return (
    <footer className="mt-16 border-t border-surface-border bg-surface-alt">
      <div className="container-x grid grid-cols-2 gap-8 py-12 sm:grid-cols-4">
        <div className="col-span-2 sm:col-span-1">
          <Image src="/akt-logo.png" alt="AKTTOOLS — Akinfo Tools Private Limited" width={110} height={65} className="h-12 w-auto" />
          <p className="mt-4 max-w-xs text-sm text-ink-soft">
            Akinfo Tools Private Limited — India’s trusted supplier of genuine mobile, laptop and
            board-level repair tools.
          </p>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.heading}>
            <h3 className="text-sm font-semibold text-ink">{col.heading}</h3>
            <ul className="mt-3 space-y-2">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm text-ink-soft transition hover:text-brand">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-surface-border">
        <div className="container-x py-5 text-xs text-ink-muted">
          © {new Date().getFullYear()} Akinfo Tools Private Limited<sup>®</sup>. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
