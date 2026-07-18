import Script from 'next/script';
import { config } from '@/lib/config';

/**
 * Google Tag Manager + Consent Mode v2. Loaded only when a GTM id is set (so staging stays clean).
 * Consent DEFAULTS to denied and is granted only after the user accepts — compliant by default,
 * while url_passthrough + ads_data_redaction preserve conversion modeling in the meantime.
 * GA4, Google Ads (Enhanced Conversions, remarketing), and Merchant tags are all managed inside
 * the GTM container — no code changes to add/adjust them later.
 */
export function Analytics() {
  if (!config.gtmId) return null;
  return (
    <>
      <Script id="consent-default" strategy="beforeInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
        gtag('consent','default',{
          ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',
          analytics_storage:'denied',functionality_storage:'granted',security_storage:'granted',
          wait_for_update:500
        });
        gtag('set','ads_data_redaction',true);
        gtag('set','url_passthrough',true);`}
      </Script>
      <Script id="gtm" strategy="afterInteractive">
        {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
        var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
        j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
        f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${config.gtmId}');`}
      </Script>
    </>
  );
}

/** The <noscript> GTM fallback — render at the top of <body>. */
export function AnalyticsNoScript() {
  if (!config.gtmId) return null;
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${config.gtmId}`}
        height="0"
        width="0"
        style={{ display: 'none', visibility: 'hidden' }}
        title="gtm"
      />
    </noscript>
  );
}
