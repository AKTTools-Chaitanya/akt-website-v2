import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { config, org } from '@/lib/config';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CartProvider } from '@/lib/cart';
import { Analytics, AnalyticsNoScript } from '@/components/Analytics';
import { JsonLd } from '@/components/JsonLd';
import { organizationSchema, websiteSchema, localBusinessSchema } from '@/lib/seo';
import './globals.css';

// Clean, quiet, premium — the UI stays neutral so the red logo is the brand.
const sans = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-sans', display: 'swap' });

const title = 'AKTTOOLS — Mobile, Laptop & Repair Tools';
const description =
  'AKTTOOLS (Akinfo Tools) — genuine tools and spare parts for mobile, laptop and board-level repair. 24+ brands, GST invoice, same-day dispatch across India.';

export const metadata: Metadata = {
  metadataBase: new URL(config.siteUrl),
  title: { default: title, template: '%s · AKTTOOLS' },
  description,
  applicationName: org.name,
  icons: { icon: '/akt-logo-mark.png' },
  // Indexing is gated by env → staging stays out of Google until cutover.
  robots: config.indexable ? { index: true, follow: true } : { index: false, follow: false },
  openGraph: {
    type: 'website',
    siteName: org.name,
    title,
    description,
    url: config.siteUrl,
    locale: 'en_IN',
    images: [`${config.siteUrl}${org.logo}`],
  },
  twitter: { card: 'summary_large_image', title, description, images: [`${config.siteUrl}${org.logo}`] },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={sans.variable}>
      <head>
        <Analytics />
        <JsonLd data={[organizationSchema(), websiteSchema(), localBusinessSchema()]} />
      </head>
      <body>
        <AnalyticsNoScript />
        <CartProvider>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 pb-4">{children}</main>
            <Footer />
          </div>
        </CartProvider>
      </body>
    </html>
  );
}
