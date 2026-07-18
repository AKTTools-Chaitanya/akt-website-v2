# ── Build stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --prefer-offline --no-audit --no-fund

COPY . .

# NEXT_PUBLIC_* are inlined into the client bundle at BUILD time, so they must be present
# here (passed via --build-arg from the workflow / docker compose build args). The private
# server env (API_BASE_URL, MEILI_*, AUTH_COOKIE_SECRET) is read at RUNTIME, not baked in.
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_GTM_ID
ARG NEXT_PUBLIC_INDEXABLE
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_GTM_ID=$NEXT_PUBLIC_GTM_ID \
    NEXT_PUBLIC_INDEXABLE=$NEXT_PUBLIC_INDEXABLE

RUN npm run build

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Slim standalone server + assets.
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
# Meilisearch (re)index script — its only dep (meilisearch) is traced into the standalone
# node_modules, so `node scripts/reindex.mjs` runs in-container with the compose-injected env.
COPY --from=builder /app/scripts ./scripts

RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
