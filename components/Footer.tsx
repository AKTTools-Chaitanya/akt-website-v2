import Link from 'next/link';
import Image from 'next/image';
import { org } from '@/lib/config';

const COLUMNS: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: 'Shop',
    links: [
      { label: 'All categories', href: '/search' },
      { label: 'Best sellers', href: '/search?sort=discount' },
      { label: 'New arrivals', href: '/search?sort=newest' },
      { label: 'Brands', href: '/search' },
      { label: "Today's deals", href: '/search?sort=discount' },
    ],
  },
  {
    heading: 'Information',
    links: [
      { label: 'About us', href: '/about-us' },
      { label: 'Shipping & delivery', href: '/shipping-payment-policy' },
      { label: 'Returns & refunds', href: '/return-policy' },
      { label: 'FAQ', href: '/contact-us' },
      { label: 'Terms & conditions', href: '/terms-conditions' },
    ],
  },
  {
    heading: 'Help & support',
    links: [
      { label: 'Track order', href: '/account/orders' },
      { label: 'Bulk orders', href: '/account/orders' },
      { label: 'Repair guide', href: '/contact-us' },
      { label: 'Privacy policy', href: '/privacy-policy' },
      { label: 'Contact us', href: '/contact-us' },
    ],
  },
];

/** Rich dark footer — brand, utility columns, contact, payment/shipping trust, and social. */
export function Footer() {
  return (
    <footer className="mt-16 bg-ink text-white/70">
      <div className="container-x grid grid-cols-2 gap-8 py-14 sm:grid-cols-3 lg:grid-cols-5">
        <div className="col-span-2 sm:col-span-3 lg:col-span-1">
          <span className="inline-flex rounded-lg bg-white px-2.5 py-1.5">
            <Image src="/akt-logo.png" alt="AKTTOOLS — Akinfo Tools Private Limited" width={110} height={65} className="h-10 w-auto" />
          </span>
          <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-white/55">
            India&rsquo;s most trusted store for mobile &amp; laptop repair tools and genuine spare parts.
          </p>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.heading}>
            <h3 className="text-[12px] font-bold uppercase tracking-[0.1em] text-white">{col.heading}</h3>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-[13px] text-white/60 transition hover:text-white">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h3 className="text-[12px] font-bold uppercase tracking-[0.1em] text-white">Contact</h3>
          <ul className="mt-4 space-y-2.5 text-[13px] text-white/60">
            <li><a href="tel:+919640057000" className="transition hover:text-white">+91 96400 57000</a></li>
            <li><a href={`mailto:${org.email}`} className="transition hover:text-white">{org.email}</a></li>
            <li>Mon–Sat · 10 AM – 7 PM</li>
            <li>{org.address.locality}, India</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-x flex flex-col gap-4 py-6 text-[12px] text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Akinfo Tools Private Limited<sup>®</sup>. All rights reserved.</span>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span className="font-medium text-white/60">Secure payments</span>
            <span className="font-mono">VISA · Mastercard · UPI</span>
            <span className="hidden text-white/20 sm:inline">|</span>
            <span className="font-mono">Delhivery · DTDC · Blue Dart</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
