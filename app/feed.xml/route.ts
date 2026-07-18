import { getAllProductsForFeed } from '@/lib/search';
import { config, org, productUrl } from '@/lib/config';
import { firstImage } from '@/lib/price';

/**
 * Google Merchant Center product feed (RSS 2.0 + g: namespace), served at /feed.xml.
 * You paste this URL into Merchant Center once → Google re-reads it on its own schedule.
 *
 * Fixes every defect of the legacy feed: canonical akinfotools.com links (not m.), the brand is
 * set, availability/price are correct. Reads existing catalog data (Meili index) — no new API,
 * no production impact. Regenerated hourly; Google fetches on the cadence you set in Merchant Center.
 */
export const revalidate = 3600;
export const dynamic = 'force-static';

function cdata(s: unknown): string {
  return `<![CDATA[${String(s ?? '').replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;
}
function xmlEscape(s: unknown): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function stripHtml(s: unknown): string {
  return String(s ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function GET() {
  // Degrade to an empty feed if Meili is unreachable (e.g. during the CI image build) rather
  // than failing the build/response; it regenerates hourly (revalidate) once the index is live.
  const products = await getAllProductsForFeed().catch(() => []);

  const items = products
    .map((p) => {
      const link = `${config.siteUrl}${productUrl(p.pro_url)}`;
      const image = firstImage(p.pro_image);
      const onSale = p.discount_pct > 0 && p.mrp > p.price;
      const listPrice = onSale ? p.mrp : p.price;
      const description = stripHtml(p.pro_short_description || p.pro_description || p.pro_name).slice(0, 4900);

      return [
        '  <item>',
        `    <g:id>${xmlEscape(p.pro_id)}</g:id>`,
        `    <g:title>${cdata(p.pro_name)}</g:title>`,
        `    <g:description>${cdata(description)}</g:description>`,
        `    <g:link>${xmlEscape(link)}</g:link>`,
        image ? `    <g:image_link>${xmlEscape(image)}</g:image_link>` : '',
        `    <g:availability>${p.in_stock ? 'in_stock' : 'out_of_stock'}</g:availability>`,
        `    <g:price>${listPrice.toFixed(2)} INR</g:price>`,
        onSale ? `    <g:sale_price>${p.price.toFixed(2)} INR</g:sale_price>` : '',
        '    <g:condition>new</g:condition>',
        p.brand_name ? `    <g:brand>${cdata(p.brand_name)}</g:brand>` : '',
        // No GTIN/MPN in the catalog yet → tell Google honestly (feed stays valid).
        '    <g:identifier_exists>no</g:identifier_exists>',
        p.cat_name ? `    <g:product_type>${cdata(p.cat_name)}</g:product_type>` : '',
        '  </item>',
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
  <title>${xmlEscape(org.name)} — Product Feed</title>
  <link>${xmlEscape(config.siteUrl)}</link>
  <description>Genuine mobile, laptop &amp; board-level repair tools and spare parts.</description>
${items}
</channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
