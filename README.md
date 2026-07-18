# AKTTOOLS Website V2 — Phase 1 (Foundation)

A premium, mobile-first **Next.js** storefront that runs on your **existing `react-api`** — same
database, same payment, same order flow. **Zero impact on production** (separate app, staging
subdomain, instant rollback).

## What Phase 1 proves
The whole pipeline end-to-end: a **server-rendered product page** that pulls a **live product** from
the react-api, with SEO metadata + Product schema + responsive premium UI — plus the **OTP auth
bridge** (reuses your app login → secure httpOnly cookie). If the product page renders real data,
the architecture is validated.

## Structure
```
website_v2/
  app/
    page.tsx                              # staging landing (links to a live product)
    layout.tsx                            # root layout + SEO defaults (noindex on staging)
    globals.css                           # Tailwind + design tokens
    product/details/[slug]/page.tsx       # SSR product page (THE proof) — live from react-api
    api/auth/send-otp/route.ts            # OTP bridge: send
    api/auth/verify-otp/route.ts          # OTP bridge: verify → sets httpOnly cookie
  components/                             # (grows in Phase 2+)
  lib/
    config.ts                             # env + canonical URL helpers
    api.ts                                # thin client over the EXISTING react-api
    types.ts                              # response shapes
    price.ts                              # price/image/stock helpers (mirrors storefront rule)
    auth.ts                               # httpOnly auth cookie helpers
  tailwind.config.ts                      # design tokens (brand palette) — the design system
```

## Run locally (needs Node 18+)
```bash
cd migration/website_v2
cp .env.example .env.local        # already points at the STAGING api (mrtechnobaba.co.in)
npm install
npm run dev                       # → http://localhost:3000
```
Then open a real product:
`http://localhost:3000/product/details/mechanic-iboot-ad-max-plus-251-up-to-iphone-17-series`
It should render the live product (name, price, images, description) — served by SSR from the API.

Type-check anytime: `npm run typecheck`.

## Deploy to staging (v2.mrtechnobaba.co.in) — zero prod impact
On the server (Node 18+ + PM2 installed: `npm i -g pm2`):
```bash
# 1. build
cd /path/to/website_v2
cp .env.example .env.local        # set API_BASE_URL, NEXT_PUBLIC_SITE_URL, AUTH_COOKIE_SECRET
npm ci && npm run build

# 2. run under PM2 (auto-restart, survives reboot)
pm2 start "npm run start" --name akt-v2
pm2 save && pm2 startup           # once, to persist across reboots
```
Then point the subdomain at it with nginx (reverse proxy → Node on :3000):
```nginx
server {
  server_name v2.mrtechnobaba.co.in;
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
  # add TLS (certbot) as usual
}
```
Reload nginx. The PHP staging site + prod are completely untouched — this is a separate process.

## Notes / next
- **OTP on staging:** staging guards SMS, so real OTPs won't arrive. For QA we'll add a test-OTP
  path (fixed code or read the generated OTP from the DB). The verify route already flags if the
  API returns success but no token, so we can map the exact token field on the first real call.
- **Images:** `next.config.js` already allow-lists the storefront + future `images.akinfotools.com`
  CDN host, so the S3/CDN switch needs no code change here.
- **SEO:** V2 uses the SAME `/product/details/{slug}` URLs as today → clean cutover, matches the
  Google feed links. `noindex` is on until cutover.
- **Roadmap:** P2 home/header/footer/nav → P3 search (Meilisearch) + listing → P4 detail → P5
  cart/checkout/payment → P6 account/orders → P7 SEO/CWV → P8 canary + retire m. (see
  `docs/WEBSITE_V2_PLAN.md`).
