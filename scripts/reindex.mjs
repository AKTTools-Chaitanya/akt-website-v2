/**
 * Read-only catalog → Meilisearch indexer. Talks ONLY to the existing react-api over HTTP
 * (no DB creds, no PHP changes) so it runs identically on a laptop or the server.
 *
 * Run:  node --env-file=.env.local scripts/reindex.mjs
 * Needs: API_BASE_URL, MEILI_HOST, MEILI_ADMIN_KEY  (API_ALLOW_SELF_SIGNED=true for staging cert)
 *
 * Schedule on the server via cron (e.g. every 15 min) to keep the index fresh.
 */
import { MeiliSearch } from 'meilisearch';

if (process.env.API_ALLOW_SELF_SIGNED === 'true') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const API = (process.env.API_BASE_URL ?? 'https://mrtechnobaba.co.in').replace(/\/+$/, '');
const MEILI_HOST = process.env.MEILI_HOST ?? 'http://127.0.0.1:7700';
const MEILI_KEY = process.env.MEILI_ADMIN_KEY ?? 'akt_dev_master';
const INDEX = 'products';
const PAGE_SIZE = 500;

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

async function apiGet(path) {
  const res = await fetch(`${API}/${path}`);
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return res.json();
}
async function apiPost(path, body = {}) {
  const form = new URLSearchParams(body);
  const res = await fetch(`${API}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  });
  if (!res.ok) throw new Error(`POST ${path} → ${res.status}`);
  return res.json();
}

/** Build cat_id → {name,slug}, scat_id → {…}, sscat_id → {…} maps from the category tree. */
async function loadCategoryMaps() {
  const d = (await apiGet('api-categories-relationship')).data;
  const cat = new Map(), scat = new Map(), sscat = new Map();
  for (const c of d.categories ?? []) {
    cat.set(String(c.category_id), { name: c.category_name, slug: c.category_slug });
    for (const s of c.Subcategories ?? []) {
      scat.set(String(s.subcategory_id), { name: s.subcategory_name, slug: s.subcategory_slug });
      for (const ss of s.Subsubcategories ?? []) {
        sscat.set(String(ss.subsubcategory_id), { name: ss.subsubcategory_name, slug: ss.subsubcategory_slug });
      }
    }
  }
  return { cat, scat, sscat };
}

async function loadBrandMap() {
  const data = (await apiGet('api-brands')).data ?? {};
  const list = Array.isArray(data) ? data : data.brands ?? [];
  const brand = new Map();
  for (const b of list) brand.set(String(b.brand_id), { name: b.brand_name, slug: b.slug });
  return brand;
}

function toDoc(p, { cat, scat, sscat, brand }) {
  const mrp = num(p.pro_actual_price);
  const disc = num(p.pro_discounted_price);
  const onSale = disc > 0 && disc < mrp;
  const price = onSale ? disc : mrp > 0 ? mrp : disc;
  const discount_pct = onSale && mrp > 0 ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const b = brand.get(String(p.brand_id));
  const c = cat.get(String(p.cat_id));
  const s = scat.get(String(p.scat_id));
  const ss = sscat.get(String(p.sscat_id));
  return {
    ...p,
    id: num(p.pro_id),
    brand_name: b?.name,
    brand_slug: b?.slug,
    cat_name: c?.name,
    cat_slug: c?.slug,
    scat_name: s?.name,
    scat_slug: s?.slug,
    sscat_name: ss?.name,
    sscat_slug: ss?.slug,
    price,
    mrp,
    discount_pct,
    in_stock: num(p.qty) > 0,
    created_ts: p.created_on ? Date.parse(p.created_on) || 0 : 0,
  };
}

async function fetchAllProducts() {
  const first = await apiPost('api-products', { type: 'all', limit: PAGE_SIZE, page: 1 });
  const totalPages = first.pagination?.total_pages ?? 1;
  const total = first.pagination?.total_records ?? 0;
  const grab = (r) => (Array.isArray(r.data) ? r.data : r.data?.products ?? []);
  let all = grab(first);
  for (let page = 2; page <= totalPages; page++) {
    const r = await apiPost('api-products', { type: 'all', limit: PAGE_SIZE, page });
    all = all.concat(grab(r));
    process.stdout.write(`\r  fetched ${all.length}/${total} products…`);
  }
  process.stdout.write('\n');
  return all;
}

async function main() {
  console.log(`Indexer → API=${API}  MEILI=${MEILI_HOST}`);
  const [maps, brand] = await Promise.all([loadCategoryMaps(), loadBrandMap()]);
  console.log(`  maps: ${maps.cat.size} categories, ${maps.scat.size} subcategories, ${brand.size} brands`);

  const raw = await fetchAllProducts();
  // Index only main products (parent_id=0) — variants share a page and would duplicate results.
  const mains = raw.filter((p) => String(p.parent_id ?? '0') === '0');
  const docs = mains.map((p) => toDoc(p, { ...maps, brand }));
  console.log(`  ${raw.length} rows → ${docs.length} main products to index`);

  const client = new MeiliSearch({ host: MEILI_HOST, apiKey: MEILI_KEY });
  const index = client.index(INDEX);

  const settingsTask = await index.updateSettings({
    searchableAttributes: ['pro_name', 'tags', 'sku', 'brand_name', 'cat_name', 'scat_name', 'sscat_name'],
    filterableAttributes: [
      'brand_slug', 'brand_name', 'cat_slug', 'cat_name', 'scat_slug', 'scat_name',
      'sscat_slug', 'sscat_name', 'in_stock', 'price', 'cat_id', 'scat_id', 'brand_id',
    ],
    sortableAttributes: ['price', 'discount_pct', 'created_ts'],
    rankingRules: ['words', 'typo', 'proximity', 'attribute', 'sort', 'exactness'],
  });
  await client.waitForTask(settingsTask.taskUid);

  const BATCH = 1000;
  for (let i = 0; i < docs.length; i += BATCH) {
    const task = await index.addDocuments(docs.slice(i, i + BATCH), { primaryKey: 'id' });
    await client.waitForTask(task.taskUid, { timeOutMs: 60000 });
    console.log(`  indexed ${Math.min(i + BATCH, docs.length)}/${docs.length}`);
  }

  const stats = await index.getStats();
  console.log(`✓ done. Meili '${INDEX}' now has ${stats.numberOfDocuments} documents.`);
}

main().catch((e) => {
  console.error('Indexer failed:', e);
  process.exit(1);
});
