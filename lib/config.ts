// The STAGING api (mrtechnobaba.co.in) uses a SELF-SIGNED TLS cert, which Node's fetch rejects.
// Allow it ONLY when explicitly enabled (staging/dev). MUST be unset/false in production —
// akinfotools.com has a valid cert, so prod never needs (or should have) this.
if (process.env.API_ALLOW_SELF_SIGNED === 'true') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

/** Central config. All backend calls go to the EXISTING react-api — nothing is reimplemented. */
export const config = {
  /** Existing react-api base (staging while building). */
  apiBase: process.env.API_BASE_URL ?? 'https://mrtechnobaba.co.in',
  /** Canonical public origin of this V2 site. */
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://v2.mrtechnobaba.co.in',
  authCookieName: 'akt_v2_auth',
  authCookieSecret: process.env.AUTH_COOKIE_SECRET ?? 'dev-only-insecure-secret',
  /**
   * When true, the API client REFUSES any write endpoint (cart/checkout/auth/address/…) so we
   * can safely point at PROD for read-only catalog development without ever mutating prod data.
   * Turn OFF (use staging) once we build the cart/checkout/account flows.
   */
  readOnly: process.env.API_READ_ONLY === 'true',
  /** Gate indexing/analytics. FALSE on staging (noindex + no tags) → prod SEO never leaks. */
  indexable: process.env.NEXT_PUBLIC_INDEXABLE === 'true',
  /** GTM container id (empty = analytics off, e.g. staging). GA4/Ads/Merchant tags live inside GTM. */
  gtmId: process.env.NEXT_PUBLIC_GTM_ID ?? '',
};

/** Organization/brand identity — powers Organization + LocalBusiness schema, OG, footer. */
export const org = {
  name: 'AKTTOOLS',
  legalName: 'Akinfo Tools Private Limited',
  logo: '/akt-logo.png',
  phone: '+91-96400-57000', // AKT to confirm the canonical support number
  email: 'support@akinfotools.com', // AKT to confirm
  address: { locality: 'Delhi', region: 'DL', country: 'IN' },
  // AKT to confirm exact social profile URLs (drives schema `sameAs` + brand entity signals):
  sameAs: [
    'https://www.facebook.com/akinfotools',
    'https://www.instagram.com/akinfotools',
    'https://www.youtube.com/@akinfotools',
  ],
};

/**
 * "The Bench" homepage settings. These are BUSINESS policy, not product data — AKT confirms the
 * exact values. Kept here so a single edit changes the whole site (no code hunting).
 */
export const bench = {
  dispatchCutoffHour: 16, // 4 PM IST — ships-today cut-off (AKT to confirm)
  dispatchDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], // working days for same-day dispatch
  dispatchCity: 'Delhi',
  lowStockThreshold: 5, // show "N left" urgency at/below this qty
  whatsappNumber: '', // e.g. '919999999999' — AKT to provide; hides the WhatsApp bar if empty
};

/** URL helpers — SAME shapes as the current storefront, so cutover preserves SEO. */
export function productUrl(slug: string) {
  return `/product/details/${slug}`;
}
export function categoryUrl(slug: string) {
  return `/product-category/${slug}`;
}
export function brandUrl(slug: string) {
  return `/product-category/popular-brands/${slug}`;
}
export function searchUrl(q: string) {
  return `/search?q=${encodeURIComponent(q)}`;
}
