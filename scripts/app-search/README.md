# New App Search — production refresh

Keeps the New App's Meilisearch indexes (`prod_app_products`, `prod_app_terms`) in step with the
production catalogue, without the live indexes ever being emptied or written in place.

```
production api  ->  prod_app_products_next     ->  validate  ->  atomic /swap-indexes  ->  live
                    prod_app_terms_next
```

| File | Role |
|---|---|
| `build_app_search_index.mjs` | Builds the index documents from the production api. Was already in use; unchanged here. |
| `validate_prod_app_search.mjs` | Checks the replacement indexes against the production source and against the live indexes' settings. Exits non-zero on any failure. |
| `promote_prod_app_search.mjs` | Preflight, then exchanges both pairs in **one** `/swap-indexes` task. |
| `refresh_prod_app_search.sh` | The cron entry point: `flock`, build, validate, promote, log. |

## Why swap instead of reindex in place

The builder's own write path is `PATCH settings` → `DELETE /documents` → refill. Pointed at a live
index that empties it for the length of the refill — measured dropping to **0 documents with 7
partial states visible to searchers**. So the builder is only ever pointed at the `*_next` indexes,
and promotion is a single atomic swap. A poller sampling the live indexes every 300 ms across a
real scheduled run observed only the before and after counts, never zero and never a partial count.

Swapping also exchanges index *settings*, which is why `validate` requires the replacement indexes'
settings to be identical to the live ones before promoting — otherwise a swap could silently change
the contract the New App was built against.

## Safety guards

The run fails before writing anything if the production api is missing or empty (exit 2), the
Meilisearch credential is missing (exit 2), a staging api is paired with `prod_` indexes or the
production api with non-`prod_` indexes (exit 3), `ONLY` is not `''`/`products`/`terms` (exit 4), a
required index is absent (exit 4), a replacement index is empty or still indexing (exit 5), or a
replacement index is below its floor or under 90% of the live count (exit 6).

`set -euo pipefail` means a validation failure aborts before promotion, so the live indexes keep
serving the previous generation. `flock -n` makes an overlapping run exit 0 (a skipped slot is not
a failure). Build, validate and promote each have their own `timeout`.

## Credentials

The scripts run inside the `aktv2-web` container, which already holds `MEILI_ADMIN_KEY` in its
environment. No credential is passed on a command line, written to disk, or logged. The New App's
own search key is separate, search-only, and scoped to the two `prod_app_*` indexes.

## Deployment

The repo is the source of truth; the scripts are deployed to `/opt/akt-app-search/` on the KVM8
box, where `refresh_prod_app_search.sh` must be mode 750. Cron:

```
7,22,37,52 * * * * /opt/akt-app-search/refresh_prod_app_search.sh >>/var/log/akt-app-search.log 2>&1  # akt-app-search
```

Offset from the website search refresh (`*/15`) so the two jobs never contend for the same minute.

## Rollback

Each run leaves the previous generation in the `*_next` indexes. To roll back, stop the cron first
(the next run overwrites that copy), then swap the pairs back:

```
POST /swap-indexes
[{"indexes":["prod_app_products","prod_app_products_next"]},
 {"indexes":["prod_app_terms","prod_app_terms_next"]}]
```

## Not covered here

Enabling the endpoint. `api-app-search` is gated by the `app_search_v1` feature flag, which is off.
This pipeline only keeps the indexes current.
