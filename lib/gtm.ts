'use client';

/**
 * Consent-gated dataLayer helpers. All GA4 / Google Ads / Merchant events flow through GTM so tags
 * can be managed without redeploys, and everything respects Consent Mode v2 (default denied →
 * granted only after the user accepts). BigQuery-ready via GA4's native export.
 */

type DL = Record<string, unknown>;

function dataLayer(): DL[] {
  if (typeof window === 'undefined') return [];
  const w = window as unknown as { dataLayer?: DL[] };
  w.dataLayer = w.dataLayer || [];
  return w.dataLayer;
}

export function gtmPush(event: DL): void {
  dataLayer().push(event);
}

/** Map a cart line / product to a GA4 ecommerce item. */
export interface AnalyticsItem {
  item_id: string;
  item_name: string;
  price?: number;
  item_brand?: string;
  item_category?: string;
  quantity?: number;
}

/** GA4 Enhanced-Ecommerce events (names match GA4 recommended events exactly). */
export const track = {
  viewItem(item: AnalyticsItem) {
    gtmPush({ event: 'view_item', ecommerce: { currency: 'INR', value: item.price, items: [item] } });
  },
  selectItem(item: AnalyticsItem, listName?: string) {
    gtmPush({ event: 'select_item', ecommerce: { item_list_name: listName, items: [item] } });
  },
  addToCart(item: AnalyticsItem) {
    gtmPush({
      event: 'add_to_cart',
      ecommerce: { currency: 'INR', value: (item.price ?? 0) * (item.quantity ?? 1), items: [item] },
    });
  },
  removeFromCart(item: AnalyticsItem) {
    gtmPush({ event: 'remove_from_cart', ecommerce: { currency: 'INR', items: [item] } });
  },
  viewCart(items: AnalyticsItem[], value: number) {
    gtmPush({ event: 'view_cart', ecommerce: { currency: 'INR', value, items } });
  },
  beginCheckout(items: AnalyticsItem[], value: number) {
    gtmPush({ event: 'begin_checkout', ecommerce: { currency: 'INR', value, items } });
  },
  purchase(txnId: string, items: AnalyticsItem[], value: number) {
    gtmPush({ event: 'purchase', ecommerce: { transaction_id: txnId, currency: 'INR', value, items } });
  },
  search(term: string) {
    gtmPush({ event: 'search', search_term: term });
  },
  // Micro-conversions that Google Ads can optimise toward:
  whatsappClick() {
    gtmPush({ event: 'contact', method: 'whatsapp' });
  },
  signUp(method = 'otp') {
    gtmPush({ event: 'sign_up', method });
  },
};

/**
 * Consent Mode v2 update — call when the user accepts/declines the banner. Persists via GTM's
 * consent state; url_passthrough + ads_data_redaction keep measurement working while denied.
 */
export function updateConsent(granted: boolean): void {
  const state = granted ? 'granted' : 'denied';
  gtmPush({
    event: 'consent_update',
    consent: {
      ad_storage: state,
      ad_user_data: state,
      ad_personalization: state,
      analytics_storage: state,
    },
  });
  const w = window as unknown as { gtag?: (...a: unknown[]) => void };
  w.gtag?.('consent', 'update', {
    ad_storage: state,
    ad_user_data: state,
    ad_personalization: state,
    analytics_storage: state,
  });
  try {
    localStorage.setItem('akt_consent', state);
  } catch {
    /* ignore */
  }
}
