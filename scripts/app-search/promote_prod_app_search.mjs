/**
 * AKT-APPSEARCH — atomically promote prod_app_products_next / prod_app_terms_next to live.
 *
 * Both pairs are exchanged in ONE Meilisearch /swap-indexes task, so the two indexes can never
 * disagree with each other and neither is ever empty or partially populated: a searcher sees the
 * old generation or the new one, nothing between.
 *
 * The live indexes are NEVER deleted or emptied. The displaced generation stays behind in the
 * *_next indexes and is the rollback target until the next refresh overwrites it.
 *
 * Env: MEILI_ADMIN_KEY, MEILI_HOST, APP_PRODUCTS_INDEX, APP_TERMS_INDEX (the *_next names),
 *      LIVE_PRODUCTS_INDEX, LIVE_TERMS_INDEX, optional MIN_PRODUCTS / MIN_TERMS floors.
 */
function required(name) {
  const v = process.env[name];
  if (!v || !String(v).trim()) {
    console.error(`FATAL: ${name} is required.`);
    process.exit(2);
  }
  return String(v).trim();
}
const KEY = required('MEILI_ADMIN_KEY');
const NEXT_P = required('APP_PRODUCTS_INDEX');
const NEXT_T = required('APP_TERMS_INDEX');
const LIVE_P = required('LIVE_PRODUCTS_INDEX');
const LIVE_T = required('LIVE_TERMS_INDEX');
const HOST = process.env.MEILI_HOST ?? 'http://127.0.0.1:7700';
const MIN_PRODUCTS = Number(process.env.MIN_PRODUCTS ?? 8000);
const MIN_TERMS = Number(process.env.MIN_TERMS ?? 5000);
const TIMEOUT_MS = 20000;

if (!(NEXT_P.startsWith('prod_') && NEXT_T.startsWith('prod_'))) {
  console.error(`FATAL: replacement indexes must be prod_-prefixed. Got ${NEXT_P} / ${NEXT_T}.`);
  process.exit(3);
}
if (NEXT_P === LIVE_P || NEXT_T === LIVE_T) {
  console.error('FATAL: replacement index must not be the live index.');
  process.exit(3);
}

async function meili(path, { method = 'GET', body } = {}) {
  const r = await fetch(`${HOST}${path}`, {
    method,
    headers: { Authorization: `Bearer ${KEY}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`Meili ${method} ${path} -> ${r.status} ${t.slice(0, 200)}`);
  return t ? JSON.parse(t) : {};
}
async function waitTask(uid, timeoutMs = 120000) {
  const t0 = Date.now();
  for (;;) {
    const t = await meili(`/tasks/${uid}`);
    if (t.status === 'succeeded') return t;
    if (t.status === 'failed' || t.status === 'canceled') {
      throw new Error(`swap task ${uid} ${t.status}: ${JSON.stringify(t.error ?? {})}`);
    }
    if (Date.now() - t0 > timeoutMs) throw new Error(`swap task ${uid} timed out`);
    await new Promise((r) => setTimeout(r, 200));
  }
}

/* ---------------------------------------------------------------- preflight */
const present = (await meili('/indexes?limit=1000')).results.map((i) => i.uid);
for (const ix of [LIVE_P, LIVE_T, NEXT_P, NEXT_T]) {
  if (!present.includes(ix)) {
    console.error(`FATAL: index ${ix} does not exist - refusing to promote.`);
    process.exit(4);
  }
}
const [np, nt, lp, lt] = await Promise.all([
  meili(`/indexes/${NEXT_P}/stats`), meili(`/indexes/${NEXT_T}/stats`),
  meili(`/indexes/${LIVE_P}/stats`), meili(`/indexes/${LIVE_T}/stats`),
]);
for (const [label, s] of [[NEXT_P, np], [NEXT_T, nt]]) {
  if (s.isIndexing) { console.error(`FATAL: ${label} is still indexing - refusing to promote.`); process.exit(5); }
  if (!s.numberOfDocuments) { console.error(`FATAL: ${label} is empty - refusing to promote.`); process.exit(5); }
}
if (np.numberOfDocuments < MIN_PRODUCTS) {
  console.error(`FATAL: ${NEXT_P} has ${np.numberOfDocuments} docs, below the ${MIN_PRODUCTS} floor - refusing.`);
  process.exit(6);
}
if (nt.numberOfDocuments < MIN_TERMS) {
  console.error(`FATAL: ${NEXT_T} has ${nt.numberOfDocuments} docs, below the ${MIN_TERMS} floor - refusing.`);
  process.exit(6);
}
/* never replace a healthy live index with one far smaller */
if (lp.numberOfDocuments && np.numberOfDocuments / lp.numberOfDocuments < 0.9) {
  console.error(`FATAL: ${NEXT_P} is ${np.numberOfDocuments} vs live ${lp.numberOfDocuments} (<90%) - refusing.`);
  process.exit(6);
}

console.log(`  promoting products: ${LIVE_P}=${lp.numberOfDocuments} <- ${NEXT_P}=${np.numberOfDocuments}`);
console.log(`  promoting terms   : ${LIVE_T}=${lt.numberOfDocuments} <- ${NEXT_T}=${nt.numberOfDocuments}`);

/* ---------------------------------------------------------------- atomic swap */
const task = await meili('/swap-indexes', {
  method: 'POST',
  body: [{ indexes: [LIVE_P, NEXT_P] }, { indexes: [LIVE_T, NEXT_T] }],
});
await waitTask(task.taskUid);

const [ap, at, bp, bt] = await Promise.all([
  meili(`/indexes/${LIVE_P}/stats`), meili(`/indexes/${LIVE_T}/stats`),
  meili(`/indexes/${NEXT_P}/stats`), meili(`/indexes/${NEXT_T}/stats`),
]);
console.log(`  promoted in one task (uid ${task.taskUid})`);
console.log(`  live    : ${LIVE_P}=${ap.numberOfDocuments}  ${LIVE_T}=${at.numberOfDocuments}`);
console.log(`  rollback: ${NEXT_P}=${bp.numberOfDocuments}  ${NEXT_T}=${bt.numberOfDocuments} (previous generation)`);
