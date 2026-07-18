import { config } from './config';
import type { ApiEnvelope, Product, ProductDetailData, HomeData } from './types';

/**
 * Thin client over the EXISTING react-api. It only READS/POSTS to endpoints the mobile app
 * already uses — no business logic is reimplemented here. Called server-side (SSR) for public
 * content, so it's fast and SEO-friendly.
 *
 * The react-api routes (config/routes.php) map friendly paths → REST methods, e.g.
 *   api-product-detail → react-api/Product/productdetail  (a *_post method → POST)
 */
/**
 * Endpoints that only SELECT (safe to hit against PROD read-only). ANYTHING not in this set is
 * treated as a write and BLOCKED when config.readOnly is on — so pointing V2 at prod for catalog
 * development can never create a cart/order/account or send an OTP SMS on production.
 */
const READ_ONLY_ENDPOINTS = new Set<string>([
  'api-product-detail',
  'api-products',
  'api-home',
  'api-brands',
  'api-categories',
  'api-categories-relationship',
  'api-sub-categories',
  'api-category-subcategories',
  'api-subcategory-products',
  'api-global-search',
  'api-coupon-codes',
  'api-product-review',
  'api-about-us',
  'api-privacy-policy',
  'api-return-policy',
  'api-terms-conditions',
  'api-shipping-payment-policy',
]);

async function apiPost<T>(
  path: string,
  body: Record<string, unknown>,
  opts: { token?: string; revalidate?: number } = {}
): Promise<ApiEnvelope<T>> {
  if (config.readOnly && !READ_ONLY_ENDPOINTS.has(path)) {
    throw new Error(
      `[read-only guard] Blocked write endpoint "${path}" — API_READ_ONLY is on (pointing at prod). ` +
        `Switch API_BASE_URL to staging before building cart/checkout/auth flows.`
    );
  }

  const form = new URLSearchParams();
  for (const [k, v] of Object.entries(body)) {
    if (v !== undefined && v !== null) form.append(k, String(v));
  }

  const res = await fetch(`${config.apiBase}/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
    },
    body: form.toString(),
    // ISR-style caching for public content; auth calls pass revalidate: 0.
    next: { revalidate: opts.revalidate ?? 60 },
  });

  if (!res.ok) {
    return { status: false, message: `Upstream ${res.status}` };
  }
  return (await res.json()) as ApiEnvelope<T>;
}

/** Home page payload (banners, categories, product rails, brands). Public — no token needed. */
export async function getHome(): Promise<HomeData | null> {
  const r = await apiPost<HomeData>('api-home', {});
  return r.status && r.data ? r.data : null;
}

/** Product detail by slug (pro_url). Public — no token needed. */
export async function getProductBySlug(slug: string): Promise<ProductDetailData | null> {
  const r = await apiPost<ProductDetailData>('api-product-detail', { slug });
  return r.status && r.data ? r.data : null;
}

/** Product list (home/category/search reuse). type = all | brand | category | subcategory. */
export async function getProducts(params: {
  type?: string;
  id?: string | number;
  sort_type?: string;
  page?: number;
  limit?: number;
}): Promise<Product[]> {
  const r = await apiPost<{ products?: Product[] } | Product[]>('api-products', {
    type: params.type ?? 'all',
    ...params,
  });
  if (!r.status || !r.data) return [];
  const d = r.data as any;
  return Array.isArray(d) ? d : (d.products ?? d.product ?? []);
}

/** ---- Auth (OTP). These are the pieces the auth bridge (server routes) call. ---- */
export async function sendPhoneOtp(phone: string) {
  return apiPost('api-mobile-login', { phone }, { revalidate: 0 });
}
export async function verifyPhoneOtp(phone: string, otp_code: string) {
  return apiPost<{ access_token?: string; token?: string; [k: string]: unknown }>(
    'api-verify-otp',
    { phone, otp_code },
    { revalidate: 0 }
  );
}
