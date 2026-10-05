/**
 * AKT-APPSEARCH — read-only index builder for the mobile app's search.
 * Writes TWO NEW Meili indexes and never touches the existing `products` index
 * (that one powers the V2 site listing, the Google feed and the sitemap):
 *   app_products — every catalogue product INCLUDING out of stock, lean fields
 *   app_terms    — a few thousand short suggestion terms (category/brand/model/product)
 * Source: the react-api over HTTP (no DB creds), same pattern as scripts/reindex.mjs.
 * Run:  node build_app_search_index.mjs            (env: API_BASE_URL, MEILI_HOST, MEILI_ADMIN_KEY)
 */
/* AKT-APPSEARCH-ENV 2026-10-04: every target is now named explicitly and nothing is defaulted.
   API_BASE_URL used to default to staging, so running this on the production box without naming the
   environment would have rebuilt the app indexes from the STAGING catalogue and silently served it to
   production customers. Index names were hardcoded, so the two environments also shared one index and
   either could overwrite the other. Both are now required inputs, and a mismatched pair is refused. */
function required(name) {
  const v = process.env[name];
  if (!v || !String(v).trim()) {
    console.error(`FATAL: ${name} is required. Refusing to run rather than guess an environment.`);
    process.exit(2);
  }
  return String(v).trim();
}
const API = required('API_BASE_URL').replace(/\/+$/, '');
const PRODUCTS_INDEX = required('APP_PRODUCTS_INDEX');
const TERMS_INDEX = required('APP_TERMS_INDEX');
const HOST = process.env.MEILI_HOST ?? 'http://127.0.0.1:7700';
const KEY = required('MEILI_ADMIN_KEY');

/* Makes the cross-environment mistake impossible rather than merely unlikely: production data may
   only ever be written to prod_-prefixed indexes, and staging data may never be written to them. */
/* AKT-APPSEARCH 2026-10-04: '' (default) builds both indexes exactly as before; 'products' or
   'terms' rebuilds just that one, so a settings-only correction need not touch the other. */
const ONLY = (process.env.ONLY ?? '').trim().toLowerCase();
if (ONLY !== '' && ONLY !== 'products' && ONLY !== 'terms') {
  console.error(`FATAL: ONLY must be unset, 'products' or 'terms' (got '${ONLY}').`);
  process.exit(4);
}

const isProdApi = /akinfotools\.com/i.test(API);
const prodNames = PRODUCTS_INDEX.startsWith('prod_') && TERMS_INDEX.startsWith('prod_');
if (isProdApi !== prodNames) {
  console.error(`FATAL: environment mismatch — API_BASE_URL=${API} with indexes ${PRODUCTS_INDEX} / ${TERMS_INDEX}.`);
  console.error('The production API requires prod_-prefixed indexes; the staging API must not use them.');
  process.exit(3);
}
console.log(`source ${API} -> indexes ${PRODUCTS_INDEX} / ${TERMS_INDEX} on ${HOST}`);
const PAGE = 500;
const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const clean = (s) => { const v = String(s ?? '').replace(/\s+/g, ' ').trim(); return (v === 'None' || v === 'null' || v === '0') ? '' : v; };

async function apiPost(path, body = {}) {
  const res = await fetch(`${API}/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(body).toString() });
  if (!res.ok) throw new Error(`POST ${path} → ${res.status}`);
  return res.json();
}
async function meili(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${HOST}${path}`, { method, headers: { Authorization: `Bearer ${KEY}`, ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined });
  if (!res.ok) throw new Error(`Meili ${method} ${path} → ${res.status} ${await res.text().catch(() => '')}`);
  return res.json();
}
async function waitTask(uid, timeoutMs = 120000) {
  const t0 = Date.now();
  for (;;) {
    const t = await meili(`/tasks/${uid}`);
    if (t.status === 'succeeded') return t;
    if (t.status === 'failed' || t.status === 'canceled') throw new Error(`task ${uid} ${t.status}: ${JSON.stringify(t.error || {})}`);
    if (Date.now() - t0 > timeoutMs) throw new Error(`task ${uid} timeout`);
    await new Promise((r) => setTimeout(r, 300));
  }
}

/**
 * Every catalogue row, INCLUDING out of stock, from the EXISTING api-products.
 * AKT-APPSEARCH 2026-09-23: this replaced the New-App-only api-app-catalog. The two switches are
 * additive and default-off on that endpoint, so nothing else that calls api-products is affected:
 *   include_oos=1  keep out-of-stock rows (the default WHERE has `AND qty > 0`)
 *   fields=index   lean columns + brand/category names
 * `sort_type=oldtonew` walks pro_id ASC, which is the stable order a full crawl needs.
 * Variable-price products are dropped here (the index has no price for them).
 */
async function fetchProducts() {
  const get = async (page) => {
    const body = new URLSearchParams({ type: 'all', sort_type: 'oldtonew', include_oos: '1', fields: 'index', limit: String(PAGE), page: String(page) });
    const res = await fetch(`${API}/api-products`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() });
    if (!res.ok) throw new Error(`POST api-products p${page} → ${res.status}`);
    const j = await res.json();
    if (!j?.status) throw new Error(`api-products says ${JSON.stringify(j).slice(0, 120)}`);
    return { products: j.data.products, total: j.pagination.total_records, pages: j.pagination.total_pages };
  };
  const first = await get(1);
  const rows = [...first.products];
  for (let p = 2; p <= first.pages; p++) {
    rows.push(...(await get(p)).products);
    process.stdout.write(`\r  fetched ${rows.length}/${first.total}`);
  }
  process.stdout.write('\n');
  return rows.filter((r) => Number(r.variable_price) === 0);
}

const toDoc = (p) => {
  const price = num(p.pro_discounted_price) || num(p.pro_actual_price);
  const mrp = num(p.pro_actual_price);
  return {
    id: String(p.pro_id), name: clean(p.pro_name), slug: clean(p.pro_url), sku: clean(p.sku), tags: clean(p.tags).slice(0, 2000),
    brand_id: num(p.brand_id), brand: clean(p.brand_name), cat_id: num(p.cat_id), cat: clean(p.cat_name),
    scat_id: num(p.scat_id), scat: clean(p.scat_name), sscat: clean(p.sscat_name),
    stock_note: clean(p.stock_message) || '',
    image: clean(String(p.pro_image ?? '').split(',')[0]),
    price, mrp: mrp > price ? mrp : 0, discount_pct: mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0,
    qty: num(p.qty), in_stock: num(p.qty) > 0, min_order: Math.max(1, num(p.min_order)), jump: Math.max(1, num(p.jump_value)),
    created_ts: Date.parse(p.created_on || '') || 0, best_selling: String(p.best_selling) === '1',
  };
};

/** Suggestion terms: categories, brands, model phrases and strong product names — each with a count and one image. */
function buildTerms(docs) {
  const bump = (map, key, o) => { const e = map.get(key); if (e) { e.n += o.n ?? 1; if (!e.image && o.image) e.image = o.image; } else map.set(key, { ...o, n: o.n ?? 1 }); };
  const cats = new Map(), brands = new Map(), models = new Map(), names = new Map();
  const STOP = new Set(['for', 'and', 'with', 'the', 'pro', 'new', 'set', 'kit', 'mm', 'pcs']);
  for (const d of docs) {
    if (d.cat) bump(cats, 'c:' + d.cat.toLowerCase(), { type: 'category', label: d.cat, target: { type: 'category', id: d.cat_id }, image: d.image });
    if (d.scat) bump(cats, 's:' + d.scat.toLowerCase(), { type: 'category', label: d.scat, target: { type: 'subcategory', id: d.scat_id }, image: d.image });
    if (d.brand) bump(brands, d.brand.toLowerCase(), { type: 'brand', label: d.brand, target: { type: 'brand', id: d.brand_id }, image: d.image });
    // model phrase = first two words of the product name, when the first word is a real token
    const w = d.name.split(' ').filter(Boolean);
    if (w.length >= 2 && !STOP.has(w[0].toLowerCase()) && w[0].length >= 2) {
      const label = `${w[0]} ${w[1]}`.replace(/[,/]+$/, '');
      if (label.length >= 4) bump(models, label.toLowerCase(), { type: 'model', label, target: { type: 'search', q: label }, image: d.image });
    }
    if (d.name.length >= 6) bump(names, d.name.toLowerCase(), { type: 'product', label: d.name, target: { type: 'product', id: Number(d.id) }, image: d.image, n: 1 });
  }
  const out = [];
  const push = (map, min) => { for (const [k, v] of map) if (v.n >= min) out.push({ id: (v.type[0] + '_' + k).replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 120), term: v.label.toLowerCase(), label: v.label, type: v.type, n: v.n, image: v.image, target: JSON.stringify(v.target) }); };
  push(cats, 1); push(brands, 1);
  // model phrases: keep those seen twice, and single ones that look like a model code (JTX XD-7, Mi-16, SS-033)
  for (const [k, v] of models) if (v.n >= 2 || /\d/.test(v.label)) out.push({ id: ('m_' + k).replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 120), term: v.label.toLowerCase(), label: v.label, type: 'model', n: v.n, image: v.image, target: JSON.stringify(v.target) });
  // only the most distinctive product names, so the term index stays small
  const top = [...names.values()].filter((v) => v.n === 1).slice(0, 2500);
  for (const v of top) out.push({ id: ('p_' + v.label.toLowerCase()).replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 120), term: v.label.toLowerCase(), label: v.label, type: v.type, n: 1, image: v.image, target: JSON.stringify(v.target) });
  const seen = new Set();
  return out.filter((t) => (seen.has(t.id) ? false : (seen.add(t.id), true)));
};

async function replaceIndex(uid, primaryKey, settings, docs) {
  await waitTask((await meili(`/indexes/${uid}/settings`, { method: 'PATCH', body: settings })).taskUid).catch(async (e) => {
    await waitTask((await meili('/indexes', { method: 'POST', body: { uid, primaryKey } })).taskUid);
    await waitTask((await meili(`/indexes/${uid}/settings`, { method: 'PATCH', body: settings })).taskUid);
  });
  await waitTask((await meili(`/indexes/${uid}/documents`, { method: 'DELETE' })).taskUid);
  for (let i = 0; i < docs.length; i += 1000) {
    await waitTask((await meili(`/indexes/${uid}/documents?primaryKey=${primaryKey}`, { method: 'POST', body: docs.slice(i, i + 1000) })).taskUid);
    process.stdout.write(`\r  ${uid}: ${Math.min(i + 1000, docs.length)}/${docs.length}`);
  }
  process.stdout.write('\n');
}

const t0 = Date.now();
const rows = await fetchProducts();
const docs = rows.map(toDoc).filter((d) => d.id && d.name);
const terms = buildTerms(docs);
console.log(`products ${docs.length} (out of stock ${docs.filter((d) => !d.in_stock).length}) · terms ${terms.length}`);
if (ONLY === '' || ONLY === 'products') await replaceIndex(PRODUCTS_INDEX, 'id', {
  searchableAttributes: ['name', 'tags', 'sku', 'brand', 'scat', 'cat', 'sscat'],
  filterableAttributes: ['brand', 'brand_id', 'cat', 'cat_id', 'scat', 'scat_id', 'in_stock', 'price', 'discount_pct'],
  sortableAttributes: ['price', 'discount_pct', 'created_ts'],
  displayedAttributes: ['id', 'name', 'slug', 'image', 'price', 'mrp', 'discount_pct', 'in_stock', 'qty', 'min_order', 'jump', 'brand', 'cat', 'scat'],
  /* AKT-APPSEARCH 2026-10-04: the six Meilisearch defaults, then in-stock first and best-sellers
     boosted. These two were only ever applied by hand on staging, so every rebuild silently lost
     them and a fresh index ranked out-of-stock products alongside in-stock ones. Set explicitly
     here so the setting survives a rebuild. */
  rankingRules: ['words', 'typo', 'proximity', 'attribute', 'sort', 'exactness', 'in_stock:desc', 'best_selling:desc'],
  pagination: { maxTotalHits: 1000 },
}, docs);
if (ONLY === '' || ONLY === 'terms') await replaceIndex(TERMS_INDEX, 'id', {
  searchableAttributes: ['term', 'label'],
  filterableAttributes: ['type'],
  sortableAttributes: ['n'],
  displayedAttributes: ['label', 'type', 'n', 'image', 'target'],
  rankingRules: ['words', 'typo', 'proximity', 'attribute', 'sort', 'exactness', 'n:desc'],
  pagination: { maxTotalHits: 100 },
}, terms);
console.log(`done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
