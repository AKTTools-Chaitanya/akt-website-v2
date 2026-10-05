#!/bin/bash
# AKT-APPSEARCH — recurring production refresh for the New App search indexes.
#
#   production api  ->  prod_app_products_next / prod_app_terms_next  ->  validate  ->  atomic swap
#
# The live indexes are never deleted, emptied or written in place. A failure anywhere before the
# swap leaves the live indexes serving the previous generation untouched, because `set -e` aborts
# the run and only the *_next indexes were ever written.
#
# Deployed to /opt/akt-app-search/ on the KVM8 box; source of truth is the akt-website-v2 repo.
# The scripts run INSIDE the aktv2-web container, which already holds MEILI_ADMIN_KEY in its
# environment, so no credential is ever passed on a command line, written to disk or logged.
set -euo pipefail

LOCK=/var/lock/akt-app-search-prod.lock
COMPOSE_DIR=/opt/akt-website-v2
SCRIPT_DIR=/opt/akt-app-search

API=https://akinfotools.com
LIVE_PRODUCTS=prod_app_products
LIVE_TERMS=prod_app_terms
NEXT_PRODUCTS=prod_app_products_next
NEXT_TERMS=prod_app_terms_next

BUILD_TIMEOUT=600
VALIDATE_TIMEOUT=300
PROMOTE_TIMEOUT=180

log() { echo "$(date -Is) $*"; }

# One run at a time. flock is held on fd 9 for the life of this process; a second invocation
# exits 0 (a skip is not a failure) so cron does not raise noise when a run overruns its slot.
exec 9>"$LOCK"
if ! flock -n 9; then
  log "refresh already running; skipping this slot"
  exit 0
fi

cd "$COMPOSE_DIR"
CID=$(docker compose ps -q web)
if [ -z "$CID" ]; then
  log "FATAL: aktv2-web container is not running; aborting without touching the live indexes"
  exit 1
fi

# Copy the three scripts in fresh each run, so the deployed files are always what executes.
docker cp "$SCRIPT_DIR/build_app_search_index.mjs"     "$CID:/tmp/akt_app_build.mjs"
docker cp "$SCRIPT_DIR/validate_prod_app_search.mjs"   "$CID:/tmp/akt_app_validate.mjs"
docker cp "$SCRIPT_DIR/promote_prod_app_search.mjs"    "$CID:/tmp/akt_app_promote.mjs"

log "building $NEXT_PRODUCTS + $NEXT_TERMS from $API"
timeout "$BUILD_TIMEOUT" docker compose exec -T \
  -e API_BASE_URL="$API" \
  -e APP_PRODUCTS_INDEX="$NEXT_PRODUCTS" \
  -e APP_TERMS_INDEX="$NEXT_TERMS" \
  web node /tmp/akt_app_build.mjs

log "build ok; validating against the production source"
timeout "$VALIDATE_TIMEOUT" docker compose exec -T \
  -e API_BASE_URL="$API" \
  -e APP_PRODUCTS_INDEX="$NEXT_PRODUCTS" \
  -e APP_TERMS_INDEX="$NEXT_TERMS" \
  -e LIVE_PRODUCTS_INDEX="$LIVE_PRODUCTS" \
  -e LIVE_TERMS_INDEX="$LIVE_TERMS" \
  web node /tmp/akt_app_validate.mjs

log "validation passed; promoting atomically"
timeout "$PROMOTE_TIMEOUT" docker compose exec -T \
  -e APP_PRODUCTS_INDEX="$NEXT_PRODUCTS" \
  -e APP_TERMS_INDEX="$NEXT_TERMS" \
  -e LIVE_PRODUCTS_INDEX="$LIVE_PRODUCTS" \
  -e LIVE_TERMS_INDEX="$LIVE_TERMS" \
  web node /tmp/akt_app_promote.mjs

log "done"
