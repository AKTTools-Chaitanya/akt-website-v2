import type { Metadata } from 'next';
import { config, org, productUrl } from './config';
import type { Product } from './types';
import { priceView, allImages, inStock } from './price';

/** Absolute URL on the canonical origin — used for canonical, OG, schema, sitemap. */
export function absoluteUrl(path = '/'): string {
  return `${config.siteUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

/* ----------------------------------- Metadata ----------------------------------- */

/**
 * One helper for every page's <head>: title, description, canonical, Open Graph, Twitter card,
 * and robots (noindex off-prod so staging never leaks). Keeps meta consistent and gap-free.
 */
export function buildMetadata(opts: {
  title: string;
  description?: string;
  path: string;
  images?: string[];
  type?: 'website' | 'article' | 'product';
  noindex?: boolean;
}): Metadata {
  const url = absoluteUrl(opts.path);
  const images = (opts.images ?? [absoluteUrl(org.logo)]).filter(Boolean);
  const index = config.indexable && !opts.noindex;
  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: url },
    robots: index ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: {
      title: opts.title,
      description: opts.description,
      url,
      siteName: org.name,
      type: opts.type === 'product' ? 'website' : (opts.type ?? 'website'),
      images,
      locale: 'en_IN',
    },
    twitter: {
      card: 'summary_large_image',
      title: opts.title,
      description: opts.description,
      images,
    },
  };
}

/* ------------------------------------ Schema ------------------------------------ */

/** Organization — the brand entity (Knowledge Graph / AI-search / sitelinks). */
export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${config.siteUrl}/#organization`,
    name: org.name,
    legalName: org.legalName,
    url: config.siteUrl,
    logo: absoluteUrl(org.logo),
    email: org.email,
    telephone: org.phone,
    sameAs: org.sameAs,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: org.phone,
      contactType: 'customer service',
      areaServed: 'IN',
      availableLanguage: ['en', 'hi'],
    },
  };
}

/** WebSite + SearchAction — enables Google's sitelinks search box. */
export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${config.siteUrl}/#website`,
    url: config.siteUrl,
    name: org.name,
    publisher: { '@id': `${config.siteUrl}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${config.siteUrl}/search?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  };
}

/** LocalBusiness — genuine-distributor + Delhi dispatch signal. */
export function localBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Store',
    '@id': `${config.siteUrl}/#store`,
    name: org.legalName,
    image: absoluteUrl(org.logo),
    url: config.siteUrl,
    telephone: org.phone,
    address: {
      '@type': 'PostalAddress',
      addressLocality: org.address.locality,
      addressRegion: org.address.region,
      addressCountry: org.address.country,
    },
    areaServed: 'IN',
  };
}

export type Crumb = { name: string; url: string };
export function breadcrumbSchema(items: Crumb[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: absoluteUrl(c.url),
    })),
  };
}

export function faqSchema(qa: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: qa.map((x) => ({
      '@type': 'Question',
      name: x.question,
      acceptedAnswer: { '@type': 'Answer', text: x.answer },
    })),
  };
}

/**
 * Product + Offer schema. Ready for reviews (AggregateRating) the moment review data exists,
 * and carries shipping/return policy so it qualifies for Google's merchant-listing rich results.
 */
export function productSchema(p: Product) {
  const pv = priceView(p);
  const images = allImages(p.pro_image);
  const brand = (p as any).brand_name as string | undefined;
  const rating = Number((p as any).rating) || 0;
  const reviews = Number((p as any).total_review) || 0;

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.pro_name,
    image: images.length ? images : [absoluteUrl(org.logo)],
    description: String(p.pro_short_description || p.pro_name || '').slice(0, 500),
    sku: p.sku || String(p.pro_id),
    ...(brand ? { brand: { '@type': 'Brand', name: brand } } : {}),
    offers: {
      '@type': 'Offer',
      priceCurrency: 'INR',
      price: pv.price,
      availability: inStock(p) ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: absoluteUrl(productUrl(p.pro_url)),
      seller: { '@id': `${config.siteUrl}/#organization` },
      // Merchant-listing eligibility (values are business policy — AKT confirms exacts):
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: { '@type': 'MonetaryAmount', value: '0', currency: 'INR' },
        shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'IN' },
      },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'IN',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 7,
        returnMethod: 'https://schema.org/ReturnByMail',
      },
    },
  };
  // Only emit ratings when real data exists (0-review stars are a spam-policy risk).
  if (rating > 0 && reviews > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: rating,
      reviewCount: reviews,
    };
  }
  return schema;
}
