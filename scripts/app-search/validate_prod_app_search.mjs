/**
 * AKT-APPSEARCH — validate prod_app_products_next / prod_app_terms_next BEFORE promotion.
 *
 * Reads only. Exits non-zero on the first failing group so the caller never promotes a bad index.
 * Compares the replacement indexes against the PRODUCTION api (the same source the builder read)
 * and against the LIVE indexes' settings, so a promotion can never silently change the contract
 * the New App was validated against.
 *
 * Env: API_BASE_URL, MEILI_ADMIN_KEY, MEILI_HOST, APP_PRODUCTS_INDEX, APP_TERMS_INDEX
 *      (the *_next names), LIVE_PRODUCTS_INDEX, LIVE_TERMS_INDEX.
 */
function required(name) {
  const v = process.env[name];
  if (!v || !String(v).trim()) {
    console.error(`FATAL: ${name} is required.`);
    process.exit(2);
  }
  return String(v).trim();
}
const API = required('API_BASE_URL').replace(/\/+$/, '');
const KEY = required('MEILI_ADMIN_KEY');
const NEXT_P = required('APP_PRODUCTS_INDEX');
const NEXT_T = required('APP_TERMS_INDEX');
const LIVE_P = required('LIVE_PRODUCTS_INDEX');
const LIVE_T = required('LIVE_TERMS_INDEX');
const HOST = process.env.MEILI_HOST ?? 'http://127.0.0.1:7700';

/* The same environment guard the builder enforces, repeated here so validation cannot be pointed
   at a staging source by mistake and then wave a production promotion through. */
if (!/akinfotools\.com$/i.test(new URL(API).host.replace(/^www\./, ''))) {
  console.error(`FATAL: validation only accepts the production api. Got ${API}.`);
  process.exit(3);
}
if (!(NEXT_P.startsWith('prod_') && NEXT_T.startsWith('prod_'))) {
  console.error(`FATAL: replacement indexes must be prod_-prefixed. Got ${NEXT_P} / ${NEXT_T}.`);
  process.exit(3);
}
if (NEXT_P === LIVE_P || NEXT_T === LIVE_T) {
  console.error('FATAL: replacement index must not be the live index.');
  process.exit(3);
}

const TIMEOUT_MS = 20000;
let fails = 0;
const ck = (label, ok, detail) => {
  if (!ok) fails++;
  console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${label.padEnd(46)} ${detail}`);
};

async function meili(path, body) {
  const r = await fetch(`${HOST}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { Authorization: `Bearer ${KEY}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`Meili ${path} -> ${r.status} ${t.slice(0, 200)}`);
  return t ? JSON.parse(t) : {};
}
const search = (ix, body) => meili(`/indexes/${ix}/search`, body);

/* The builder normalises every string field through this before indexing (build_app_search_index.mjs).
   Comparisons must apply the same normalisation or trailing whitespace in the source - e.g.
   scat_name "Scrap Motherboard " - reads as a mismatch when the index value is in fact correct. */
const clean = (s) => {
  const v = String(s ?? '').replace(/\s+/g, ' ').trim();
  return (v === 'None' || v === 'null' || v === '0') ? '' : v;
};

async function apiProducts(params) {
  const r = await fetch(`${API}/api-products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params).toString(),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!r.ok) throw new Error(`api-products -> ${r.status}`);
  return r.json();
}

console.log(`validating ${NEXT_P} / ${NEXT_T} against ${API}`);

/* ---------------------------------------------------------------- 1. presence */
console.log('\n=== presence ===');
const all = (await meili('/indexes?limit=1000')).results.map((i) => i.uid);
for (const ix of [NEXT_P, NEXT_T, LIVE_P, LIVE_T]) {
  ck(`index exists: ${ix}`, all.includes(ix), all.includes(ix) ? 'present' : 'MISSING');
}
if (fails) { console.error('\nFATAL: required indexes missing - refusing to continue.'); process.exit(4); }

const sp = await meili(`/indexes/${NEXT_P}/stats`);
const st = await meili(`/indexes/${NEXT_T}/stats`);
ck('replacement products not indexing', sp.isIndexing === false, `isIndexing=${sp.isIndexing}`);
ck('replacement terms not indexing', st.isIndexing === false, `isIndexing=${st.isIndexing}`);
ck('replacement products non-empty', sp.numberOfDocuments > 0, `${sp.numberOfDocuments} docs`);
ck('replacement terms non-empty', st.numberOfDocuments > 0, `${st.numberOfDocuments} docs`);

/* ---------------------------------------------------------------- 2. counts vs source */
console.log('\n=== counts vs production source ===');
const first = await apiProducts({ type: 'all', limit: '1', page: '1', include_oos: '1', fields: 'index' });
const sourceTotal = Number(first.pagination?.total_records ?? 0);
ck('source reachable', sourceTotal > 0, `api-products total_records=${sourceTotal}`);
/* the builder drops rows with no id/name, so allow a tiny shortfall but never a surplus */
const diff = sourceTotal - sp.numberOfDocuments;
ck('product count matches source', diff >= 0 && diff <= 5, `index=${sp.numberOfDocuments} source=${sourceTotal} (diff ${diff})`);

const live = await meili(`/indexes/${LIVE_P}/stats`);
/* a collapse guard: never promote an index far smaller than what is already live */
const ratio = live.numberOfDocuments ? sp.numberOfDocuments / live.numberOfDocuments : 1;
ck('no catalogue collapse vs live', ratio >= 0.9, `replacement/live = ${ratio.toFixed(3)} (live ${live.numberOfDocuments})`);

/* ---------------------------------------------------------------- 3. settings parity */
console.log('\n=== settings parity with the live indexes ===');
const KEYS = ['searchable-attributes', 'filterable-attributes', 'sortable-attributes', 'displayed-attributes', 'ranking-rules', 'pagination'];
for (const [nextIx, liveIx, label] of [[NEXT_P, LIVE_P, 'products'], [NEXT_T, LIVE_T, 'terms']]) {
  for (const k of KEYS) {
    const a = JSON.stringify(await meili(`/indexes/${liveIx}/settings/${k}`));
    const b = JSON.stringify(await meili(`/indexes/${nextIx}/settings/${k}`));
    ck(`${label} ${k}`, a === b, a === b ? 'identical to live' : `live=${a.slice(0, 44)} next=${b.slice(0, 44)}`);
  }
}
const rr = await meili(`/indexes/${NEXT_P}/settings/ranking-rules`);
ck('in_stock:desc present', rr.includes('in_stock:desc'), JSON.stringify(rr.slice(-2)));
ck('best_selling:desc present', rr.includes('best_selling:desc'), 'custom boosts intact');
const trr = await meili(`/indexes/${NEXT_T}/settings/ranking-rules`);
ck('terms n:desc present', trr.includes('n:desc'), 'suggestion ranking intact');

/* ---------------------------------------------------------------- 4. OOS / facets */
console.log('\n=== OOS handling and facets ===');
const f = await search(NEXT_P, { q: '', hitsPerPage: 0, page: 1, facets: ['brand', 'cat', 'scat', 'in_stock'] });
const fd = f.facetDistribution ?? {};
const ins = fd.in_stock ?? {};
ck('in_stock has both buckets', (ins.true ?? 0) > 0 && (ins.false ?? 0) > 0, JSON.stringify(ins));
ck('in_stock sums to document count', (ins.true ?? 0) + (ins.false ?? 0) === sp.numberOfDocuments,
   `${(ins.true ?? 0) + (ins.false ?? 0)} of ${sp.numberOfDocuments}`);
const nz = (k) => Object.keys(fd[k] ?? {}).filter((v) => v !== '').length;
ck('brand facet populated', nz('brand') > 0, `${nz('brand')} brands`);
ck('cat facet populated', nz('cat') > 0, `${nz('cat')} categories`);
ck('scat facet populated', nz('scat') > 0, `${nz('scat')} subcategories`);

/* ---------------------------------------------------------------- 5. field accuracy */
/* `id` is deliberately NOT a filterable attribute on this index, so documents cannot be fetched
   by id. Page the documents endpoint once instead and reuse the map for the field, newest-product
   and created_ts-ordering checks. The documents endpoint returns fields regardless of
   displayedAttributes, which is how created_ts (sortable but not displayed) is readable here. */
async function loadDocs(ix, fields) {
  const out = new Map();
  for (let off = 0; ; off += 1000) {
    const d = await meili(`/indexes/${ix}/documents?limit=1000&offset=${off}&fields=${fields.join(',')}`);
    for (const r of d.results ?? []) out.set(String(r.id), r);
    if (!d.results?.length || out.size >= (d.total ?? 0)) break;
  }
  return out;
}
console.log('\n=== field accuracy vs production source ===');
const idx = await loadDocs(NEXT_P, ['id', 'price', 'mrp', 'discount_pct', 'qty', 'in_stock', 'brand', 'cat', 'scat', 'name', 'created_ts']);
ck('full document pass', idx.size === sp.numberOfDocuments, `${idx.size} of ${sp.numberOfDocuments} documents read`);
const page = await apiProducts({ type: 'all', limit: '400', page: '1', include_oos: '1', fields: 'index' });
const rows = (page.data?.products ?? []).filter((p) => p.pro_id);
const byId = new Map();
for (const r of rows) byId.set(String(r.pro_id), r);
{
  let checked = 0;
  const bad = { present: 0, price: 0, mrp: 0, stock: 0, qty: 0, brand: 0, cat: 0, scat: 0 };
  const samples = [];
  for (const [id, src] of byId) {
    const d = idx.get(id);
    if (!d) { bad.present++; continue; }
    checked++;
    const mrp = Number(src.pro_actual_price) || 0;
    const disc = Number(src.pro_discounted_price) || 0;
    const expPrice = disc > 0 && disc < mrp ? disc : (mrp > 0 ? mrp : disc);
    const qty = Number(src.qty) || 0;
    const problems = [];
    if (Number(d.price) !== expPrice) { bad.price++; problems.push(`price ${d.price}!=${expPrice}`); }
    if (Number(d.mrp) !== mrp) { bad.mrp++; problems.push(`mrp ${d.mrp}!=${mrp}`); }
    if (Number(d.qty) !== qty) { bad.qty++; problems.push(`qty ${d.qty}!=${qty}`); }
    if (Boolean(d.in_stock) !== (qty > 0)) { bad.stock++; problems.push(`in_stock ${d.in_stock} vs qty ${qty}`); }
    if (clean(d.brand) !== clean(src.brand_name)) { bad.brand++; problems.push(`brand ${JSON.stringify(d.brand)}!=${JSON.stringify(src.brand_name)}`); }
    if (clean(d.cat) !== clean(src.cat_name)) { bad.cat++; problems.push(`cat ${JSON.stringify(d.cat)}!=${JSON.stringify(src.cat_name)}`); }
    if (clean(d.scat) !== clean(src.scat_name)) { bad.scat++; problems.push(`scat ${JSON.stringify(d.scat)}!=${JSON.stringify(src.scat_name)}`); }
    if (problems.length && samples.length < 5) samples.push(`    #${id} ${problems.join(' | ')}`);
  }
  ck('sampled products all present', bad.present === 0, `${bad.present} missing of ${byId.size}`);
  for (const k of ['price', 'mrp', 'qty', 'stock', 'brand', 'cat', 'scat']) {
    ck(`${k} matches source`, bad[k] === 0, `${bad[k]} mismatches of ${checked}`);
  }
  if (samples.length) console.log(samples.join('\n'));
}

/* ---------------------------------------------------------------- 6. newest + deactivated */
console.log('\n=== newly created / no-longer-eligible products ===');
const newest = await apiProducts({ type: 'all', limit: '10', page: '1', include_oos: '1', fields: 'index', sort_type: 'newtoold' });
const newIds = (newest.data?.products ?? []).map((p) => String(p.pro_id)).filter(Boolean);
if (newIds.length) {
  const missing = newIds.filter((i) => !idx.has(i));
  ck('newest source products indexed', missing.length === 0, `${newIds.length - missing.length}/${newIds.length}${missing.length ? ' missing ' + missing.join(',') : ''}`);
} else {
  ck('newest source products indexed', false, 'could not read newest page from source');
}
/* the index must contain ONLY what the source currently returns: nothing inactive leaks in,
   which is what a clean rebuild guarantees and an upsert-only refresh does not */
ck('index not larger than source', sp.numberOfDocuments <= sourceTotal, `${sp.numberOfDocuments} <= ${sourceTotal}`);

/* ---------------------------------------------------------------- 7. behaviour */
console.log('\n=== search / filters / sorts / pagination ===');
for (const q of ['microscope', 'screwdriver', 'tweezer', 'stencil']) {
  const r = await search(NEXT_P, { q, limit: 3, matchingStrategy: 'all' });
  ck(`search "${q}"`, (r.estimatedTotalHits ?? 0) > 0, `${r.estimatedTotalHits} hits, top="${(r.hits[0]?.name ?? '').slice(0, 32)}"`);
}
const noHit = await search(NEXT_P, { q: 'zzzznotathingatall', limit: 1, matchingStrategy: 'all' });
ck('no-result query is clean', (noHit.estimatedTotalHits ?? 0) === 0 && Array.isArray(noHit.hits), '0 hits, no error');

const topBrand = Object.keys(fd.brand ?? {}).filter((v) => v !== '')[0];
const topScat = Object.keys(fd.scat ?? {}).filter((v) => v !== '')[0];
for (const [label, filter] of [
  ['brand name', `brand = "${topBrand}"`],
  ['scat name', `scat = "${topScat}"`],
  ['cat_id', 'cat_id > 0'],
  ['scat_id', 'scat_id > 0'],
  ['brand_id', 'brand_id > 0'],
  ['in_stock true', 'in_stock = true'],
  ['in_stock false (OOS)', 'in_stock = false'],
  ['price range', 'price >= 100 AND price <= 500'],
]) {
  const r = await search(NEXT_P, { q: '', limit: 1, filter });
  ck(`filter ${label}`, (r.estimatedTotalHits ?? 0) > 0, `${r.estimatedTotalHits} hits`);
}
for (const spec of ['price:asc', 'price:desc', 'discount_pct:desc']) {
  const r = await search(NEXT_P, { q: '', limit: 24, sort: [spec] });
  const [fld, dir] = spec.split(':');
  let mono = true;
  for (let i = 1; i < r.hits.length; i++) {
    const a = r.hits[i - 1][fld], b = r.hits[i][fld];
    if (dir === 'asc' ? a > b : a < b) { mono = false; break; }
  }
  ck(`sort ${spec}`, mono && r.hits.length > 0, `monotonic, first ${fld}=${r.hits[0]?.[fld]}`);
}
/* created_ts is sortable but not displayed, so read the real values from the document map */
{
  const r = await search(NEXT_P, { q: '', limit: 24, sort: ['created_ts:desc'] });
  const sortedIds = r.hits.map((h) => String(h.id));
  const seq = sortedIds.map((i) => idx.get(i)?.created_ts);
  const ok = seq.every((v) => typeof v === 'number') && seq.every((v, i) => i === 0 || seq[i - 1] >= v);
  ck('sort created_ts:desc', ok, ok ? 'strictly non-increasing' : 'ORDER BROKEN');
}
{
  const p1 = await search(NEXT_P, { q: 'tweezer', limit: 24, offset: 0, matchingStrategy: 'all' });
  const p2 = await search(NEXT_P, { q: 'tweezer', limit: 24, offset: 24, matchingStrategy: 'all' });
  const a = new Set(p1.hits.map((h) => h.id));
  const overlap = p2.hits.filter((h) => a.has(h.id)).length;
  ck('pagination pages are disjoint', overlap === 0, `${p1.hits.length} + ${p2.hits.length} rows, ${overlap} overlapping`);
  const far = await search(NEXT_P, { q: 'tweezer', limit: 24, offset: 24 * 998, matchingStrategy: 'all' });
  ck('far page is safe', Array.isArray(far.hits) && far.hits.length === 0, `${far.hits.length} rows`);
}

/* ---------------------------------------------------------------- 8. terms */
console.log('\n=== suggestions (terms index) ===');
for (const q of ['micro', 'screw', 'oca', 'tw']) {
  const r = await search(NEXT_T, {
    q, limit: 10, matchingStrategy: 'all',
    attributesToRetrieve: ['label', 'type', 'n', 'image', 'target'], sort: ['n:desc'],
  });
  const rows = r.hits ?? [];
  const shaped = rows.length > 0 && rows.every((h) => h.label && h.type && typeof h.n === 'number');
  ck(`suggest "${q}"`, shaped, `${rows.length} rows, top="${rows[0]?.label ?? '-'}" (${rows[0]?.type ?? '-'})`);
}
const types = await search(NEXT_T, { q: '', hitsPerPage: 0, page: 1, facets: ['type'] });
const td = types.facetDistribution?.type ?? {};
ck('all four term types present', ['category', 'brand', 'model', 'product'].every((t) => (td[t] ?? 0) > 0), JSON.stringify(td));
{
  const r = await search(NEXT_T, { q: 'micro', limit: 10, matchingStrategy: 'all', sort: ['n:desc'] });
  const ns = r.hits.map((h) => h.n);
  ck('suggestions ordered by n:desc', ns.every((v, i) => i === 0 || ns[i - 1] >= v), ns.slice(0, 5).join(' >= '));
  const t0 = r.hits[0];
  let target = null;
  try { target = JSON.parse(t0?.target ?? 'null'); } catch { /* reported below */ }
  ck('suggestion target parses', target && typeof target.type === 'string', JSON.stringify(target));
}

console.log(`\n=== VALIDATION: ${fails === 0 ? 'ALL PASS - safe to promote' : fails + ' CHECK(S) FAILED - DO NOT PROMOTE'} ===`);
process.exit(fails === 0 ? 0 : 1);
