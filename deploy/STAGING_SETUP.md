# Website V2 — Staging deploy (Docker + GHCR, same pattern as Institute CRM)

Deploys `v2.mrtechnobaba.co.in` on the **CloudPanel KVM8** box (same server as `mrtechnobaba.co.in`).
Flow: **push to `main` → GitHub Action builds image → pushes to GHCR → SSHes in → `docker compose up`**.

Key difference from the CRM: CloudPanel already owns nginx/80/443, so this stack binds only
`127.0.0.1:3000` and **CloudPanel reverse-proxies** the domain to it. Meili is published on
loopback only (`127.0.0.1:7700`) because the production PHP site reads it for instant search.

---

## One-time server setup (run as root on the KVM8 box)

### 1. Install Docker (if not present)
```bash
command -v docker || { curl -fsSL https://get.docker.com | sh; systemctl enable --now docker; }
docker compose version
```

### 2. Create the deploy dir + compose files
```bash
mkdir -p /opt/akt-website-v2 && cd /opt/akt-website-v2
# Copy these two files from the repo into this dir (scp, or paste):
#   docker-compose.yml
#   docker-compose.prod.yml
```

### 3. Create the server `.env`
```bash
cd /opt/akt-website-v2
# Start from deploy/.env.server.example, then fill secrets:
nano .env
openssl rand -hex 32   # use for MEILI_MASTER_KEY
openssl rand -hex 32   # use for AUTH_COOKIE_SECRET
```

### 4. SSH deploy key for GitHub Actions
On the **KVM8 box**:
```bash
ssh-keygen -t ed25519 -C 'gha-akt-website-v2' -f ~/.ssh/aktv2_deploy -N ''
cat ~/.ssh/aktv2_deploy.pub >> ~/.ssh/authorized_keys
cat ~/.ssh/aktv2_deploy      # <-- copy the PRIVATE key for the secret below
```

### 5. Add GitHub repo secrets
`github.com/AKTTools-Chaitanya/akt-website-v2` → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Value |
|---|---|
| `VPS_HOST` | KVM8 IP (e.g. `82.112.236.237`) |
| `VPS_USER` | `root` (or the deploy user) |
| `VPS_SSH_KEY` | the **private** key printed above (full text) |
| `VPS_PORT` | `22` (only if non-default) |

(Optional **Variables**, else defaults are used: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_GTM_ID`, `NEXT_PUBLIC_INDEXABLE`.)

### 6. CloudPanel: point the domain at the container
CloudPanel → **Add Site → Reverse Proxy**:
- Domain: `v2.mrtechnobaba.co.in`
- Reverse Proxy URL: `http://127.0.0.1:3000`
Then **SSL/TLS → Let's Encrypt** to issue a cert. (Add a DNS A-record for `v2` → KVM8 IP first.)

---

## First deploy
Push to `main` (or run the workflow manually). The Action builds, pushes, and deploys. To bring
it up by hand the first time:
```bash
cd /opt/akt-website-v2
echo "$GITHUB_TOKEN" | docker login ghcr.io -u <your-gh-user> --password-stdin   # PAT w/ read:packages
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```
Do **not** index as part of bringing the stack up — see the next section. The `products` index is
owned by a separate production refresh job and is already populated.

Verify: `curl -I http://127.0.0.1:3000` → `200`, then open `https://v2.mrtechnobaba.co.in`.

## Keep the search index fresh (cron)
Deploys do **not** index anything. The `products` index is refreshed from the **production** api
every 15 minutes by a server-side script on the KVM8 box:
```bash
*/15 * * * * /opt/akt-website-v2/scripts/refresh_products.sh >>/var/log/akt-website-search.log 2>&1  # akt-website-search
```
`refresh_products.sh` takes an `flock` (so runs cannot overlap), builds a clean `products_next`
with `reindex_prod.mjs`, then `promote_products.mjs` swaps it in atomically via Meilisearch
`/swap-indexes`. Consequences worth knowing:

- the live index is never emptied or partially populated — searchers see the old generation or the new one;
- each run is a clean rebuild, so products that are no longer eligible are **dropped** (the old job only upserted, so they accumulated);
- `reindex_prod.mjs` refuses to run against any source other than the production api, and refuses to write `products` directly.

Do **not** run `scripts/reindex.mjs` on this server. It reads `API_BASE_URL` (staging here) and
upserts into the live index in place — that is exactly what served staging prices in production
website search until 2026-10-04. It is kept only as a local-development tool (`npm run reindex`).

## Notes / safety
- Staging is **non-indexable** (`NEXT_PUBLIC_INDEXABLE=false`) → robots noindex, no sitemap tags. Google never sees it.
- Reuses the **existing react-api** — no PHP/DB changes. But this stack is **not** prod-isolated:
  the `products` Meili index it owns is also read by the production site's instant/smart search
  (`akinfotools.com`), so anything that writes that index affects production.
- `web` is bound to loopback only. Meili **is** published, on `127.0.0.1:7700`, so the production
  PHP site can reach it; loopback only, nothing publicly exposed except the CloudPanel-proxied domain.
- Rollback: `docker compose ... pull web` a previous `sha-XXXX` tag, or restore the prior image; instant.
