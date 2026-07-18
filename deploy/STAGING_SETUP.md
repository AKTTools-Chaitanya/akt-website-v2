# Website V2 — Staging deploy (Docker + GHCR, same pattern as Institute CRM)

Deploys `v2.mrtechnobaba.co.in` on the **CloudPanel KVM8** box (same server as `mrtechnobaba.co.in`).
Flow: **push to `main` → GitHub Action builds image → pushes to GHCR → SSHes in → `docker compose up`**.

Key difference from the CRM: CloudPanel already owns nginx/80/443, so this stack binds only
`127.0.0.1:3000` and **CloudPanel reverse-proxies** the domain to it. Meili stays internal.

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
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T web node scripts/reindex.mjs
```
Verify: `curl -I http://127.0.0.1:3000` → `200`, then open `https://v2.mrtechnobaba.co.in`.

## Keep the search index fresh (cron)
The workflow reindexes on every deploy. For ongoing freshness add a cron on the KVM8 box:
```bash
# every 15 min — rebuild Meili from the live catalog (read-only, no DB creds)
*/15 * * * * cd /opt/akt-website-v2 && docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T web node scripts/reindex.mjs >/var/log/aktv2-reindex.log 2>&1
```

## Notes / safety
- Staging is **non-indexable** (`NEXT_PUBLIC_INDEXABLE=false`) → robots noindex, no sitemap tags. Google never sees it.
- Reuses the **existing react-api** (staging) — no PHP/DB changes, zero prod impact.
- `web` is bound to loopback only; Meili has **no** host port. Nothing new is publicly exposed except the CloudPanel-proxied domain.
- Rollback: `docker compose ... pull web` a previous `sha-XXXX` tag, or restore the prior image; instant.
