# Environment, migration and deployment

**No production migration or deployment has been executed.** Source publication does not authorize production changes. The application is prepared for a separately approved staging rehearsal and production release only after these gates pass.

## Environment separation

| Variable                        | Runtime responsibility                                                                                                                                                                              |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                  | Backend only: dedicated non-owner login inheriting `lumavok_runtime`, with required TLS/pooler parameters. Never the owner/migration connection.                                                    |
| `DIRECT_URL`                    | Separate migration job only: securely injected direct administrative connection. Production API configuration rejects it.                                                                           |
| `SUPABASE_URL`                  | Backend project URL; HTTPS in production. Use the intended staging/production project, not an unrelated connected MCP project.                                                                      |
| `SUPABASE_PUBLISHABLE_KEY`      | Backend Auth public/publishable key. No service-role key is accepted as a browser configuration.                                                                                                    |
| `SUPABASE_STORAGE_KEY`          | Backend-only Storage credential. Required in production, isolated from the SQL runtime login and migration credentials.                                                                             |
| `CORS_ORIGIN`                   | Exact web origin, HTTPS in production, no trailing path. Mutation Origin must match.                                                                                                                |
| `AUTH_REDIRECT_URL`             | Approved HTTPS reset-password URL in production; configure it in managed Auth as well.                                                                                                              |
| `AUTH_COOKIE_NAME`              | Defaults to `refresh_token`; must match the frontend cookie navigation gate. Prefer retaining the documented default.                                                                               |
| `REFRESH_TOKEN_EXPIRES_IN_DAYS` | Cookie lifetime, 1–30 days, default 7; managed Auth remains the session authority.                                                                                                                  |
| `CONTENT_READ_MODE`             | `localized` normally; controlled legacy-read compatibility mode is an operator rollback aid, not an automatic fallback on errors.                                                                   |
| `TRUST_PROXY_HOPS`              | Default 0. Configure only after verifying the real proxy chain and blocking direct API access. Leaving 0 behind a shared proxy also shares IP rate limits; verify legitimate-user behavior.         |
| `TERMS_URL`, `PRIVACY_URL`      | Frontend server-only configuration for operator-approved published HTTPS policy links. Legal content must be provided and approved by the business before launch.                                   |
| `PORT`, `NODE_ENV`              | API port 4000; production enables secure-cookie and strict environment checks.                                                                                                                      |
| `BACKEND_API_URL`               | Frontend server-only API target. Local default `http://localhost:4000`; supplied container build targets `http://api:4000`. Rewrites are part of the Next build, so rebuild for a different target. |

Use the committed example files as templates. Supply real values through a secret manager or protected environment files outside Git. The frontend needs no database connection, privileged key or browser Supabase credential. Managed database URL/pooler/TLS support must be verified on staging with the chosen Prisma version and a real login.

## Migration order and preservation

| Migration                                           | Purpose                                                                                                                                      |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `20260629000000_init`                               | Retained original baseline; checksum preserved.                                                                                              |
| `20261026000100_reconcile_observed_enums`           | Reconcile supported enum values with the observed schema.                                                                                    |
| `20261026000200_expand_bilingual_core`              | Add locale/core metadata, translation relations, managed identity links, appointment compatibility, integrity constraints and query indexes. |
| `20261026000300_enforce_runtime_security`           | Scoped runtime role, RLS/column grants, protected fields, session checks and narrow counter triggers.                                        |
| `20261028100816_integrate_media_events_and_indexes` | Atomic domain notifications, query indexes, asset lifecycle/attachment FK and explicit service-role application isolation.                   |

Keep the enum reconciliation before SQL that references the new enum values. No existing domain table/column/record is dropped. The old district FK is replaced by a stricter composite FK. Initial original text, prices, IDs, media, hashes/tokens and original seeds remain. Compatibility changes are explicit in [INTEGRATION.md](INTEGRATION.md).

### Existing Lumavok database: original history or verified adoption

The observed applied history includes two migrations whose original files were unavailable in every inspected branch:

| Required original file                                | Audited SHA-256                                                    |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `20260831000001_expand_enums/migration.sql`           | `d65a7b8abef1ec0a04c18da2dccaabd8e1c0d9b9f8d29a3e21c28d20f64c89e5` |
| `20260831000002_add_tables_and_columns/migration.sql` | `768cd85a9e674e8f2dd50568b26e8433e64e2eacb8320e46335422d913eee2a5` |

Recovering these exact files remains one route. Alternatively, use the [verified baseline adoption workflow](BASELINE_AND_FREE_RESTORE.md): preserve the exact recorded checksums, review a private snapshot of the actual application schema and compare it before deployment. Only these two already-applied historical files may be absent. Do not reconstruct substitutes, edit history or use `migrate resolve` to bypass a mismatch. `npm --prefix database run migrate:preflight` remains read-only. Without a reviewed baseline it retains the strict original-file gate. Applying changes requires explicit database, target, backup and restore-test references; adoption also requires baseline approval.

Take a private verified backup and restore it into an isolated local Supabase recovery environment or an already-authorized staging project. A Pro upgrade is not required for the [free local route](BASELINE_AND_FREE_RESTORE.md). Use the existing-project preflight and replay the reviewed additive chain there. Test representative constraint validation and lock duration; new unique indexes may reveal duplicates. Local timing does not prove hosted production performance. Resolve inconsistencies through an approved data correction, not a destructive cleanup hidden in migrations.

### New isolated project

Provision managed Auth first. Use `migrate:fresh:preflight` only with a securely supplied staging `DIRECT_URL`. It requires an empty public application schema and managed `auth.users`/`auth.sessions`. The distinct `migrate:fresh` command requires `LUMAVOK_DATABASE_APPROVAL` and `LUMAVOK_TARGET_PROJECT` references. It refuses any existing application schema/history and never attempts to erase it.

The fresh path does not solve existing-production history. Do not point it at an existing database. CI fixtures create their own Auth/Storage stand-ins; that is not a managed-project migration rehearsal.

### Runtime provisioning and data cutover

Create an actual LOGIN role with an operator-generated secret, `INHERIT NOBYPASSRLS NOCREATEDB NOCREATEROLE`, inheriting only `lumavok_runtime`. Do not use `postgres` plus `SET ROLE`: startup explicitly rejects that arrangement. Set secure TLS/network rules and verify the startup assertion against the intended pooler/direct connection. Keep role credentials out of SQL files and logs.

Configure Auth email confirmation, SMTP, approved redirects, recovery template token-hash fragment flow, session lifetimes and revocation. Resolve the initially observed Auth 5xx before cutover. Existing account email alone is not proof of ownership; use [link-auth-identity.sql](../database/operations/link-auth-identity.sql) only after a separately reviewed identity mapping and session revocation plan.

Provision the private `property-media` bucket using the reviewed [operation](../database/operations/provision-private-storage.sql). It fails if an existing bucket is public; do not silently change used buckets. Verify there are no permissive object policies and the server Storage credential behaves as intended. New objects use the asset registry; retain legacy file references until separately approved verification/migration. Unattached upload cleanup remains a reviewed retention operation.

Retain English and French content exactly where its language is established. Use the private reviewed manifest with `content:check` first; `content:apply` is an explicitly approved operation with optimistic original-value preconditions. Do not commit production manifests, infer language from spelling, convert prices or relabel unknown prices as XOF. Introduce French translations as additional rows, with publication reviewed independently.

## CI and manually gated delivery

`ci.yml` runs lockfile setup, secret scan, type/lint/format checks, SQL/HTTP/frontend tests, production builds, full dependency audits, actual PostgreSQL 17 runtime/RLS tests, desktop/mobile browser journeys and both container builds. All databases are disposable; no production secret is needed. All six jobs are now required by the active `main` ruleset. Pull requests and up-to-date checks are mandatory, with deletion/force pushes blocked and no bypass actors. See [OPERATIONS_STATUS.md](OPERATIONS_STATUS.md) for verified settings and the independent-review limitation.

`release.yml` is manual. The protected `release` environment requires owner approval and the `main` branch, with administrator bypass disabled. `RELEASE_ENABLED=false` is saved explicitly; enable it only for an authorized release. Supply an exact 40-character commit with a successful CI run. It builds and publishes commit-tagged GHCR candidates. Record the resulting immutable image digests; tags alone are not deployment inputs.

`deploy.yml` is also manual. Separate protected `staging` and `production` environments now require owner approval and the `main` branch, with administrator bypass disabled. Both explicitly have `DEPLOYMENT_ENABLED=false`; set it to `true` only when the target deployment is authorized. No deployment secrets have been added. Required secrets are `DEPLOY_HOST`, `DEPLOY_USER`, `SSH_PRIVATE_KEY`, `SSH_KNOWN_HOSTS`. Verify the host key out of band; the workflow never performs permissive host-key discovery. Use a dedicated restricted deploy user/key and GHCR pull credentials on the host.

Provision `/srv/lumavok/compose.yml`, `deploy.sh` and private `api.env` plus `web.env` from the reviewed release. Supply a TLS reverse proxy using the provided Nginx location example in an existing valid TLS server block. Only the web port binds to loopback; the API has no public host port. Validate the actual forwarded-header chain, upload limits and cookie domain/scheme. Compose does not provision TLS, DNS, databases, managed backups or secrets.

Container deployment accepts only GHCR `@sha256:` image references, serializes with a lock and waits for health checks. It records the new release pointer only after success. It does **not** run database migrations. A failed health check can leave some candidate containers running, so operator rollback is an explicit step, not an automatic guarantee.

## Staging acceptance and rollback

Before production approval, demonstrate:

1. Private backup restore, schema/history checksum agreement and record/seed preservation; review migration lock durations and query plans.
2. Dedicated runtime LOGIN/pooler startup, no elevated memberships, denied Data API access and legitimate/denied RLS operations.
3. Real confirmation email, login, refresh rotation, recovery, logout/revocation and expired/deleted session rejection behind TLS/proxies.
4. EN/FR retrieval, configurable missing-translation fallback, exact-language editing, conflict handling, XOF/rental terms and verified legacy content/identity mapping.
5. Real private Storage upload/sign/display, cross-owner rejection, attached-delete rejection, failure/retry behavior and legacy reference validity without publishing private URLs.
6. Published and approved terms/privacy documents, browser journeys, monitoring/alert ownership, rate limits under the chosen replica topology, container health and rollback rehearsal.

For application rollback, retain prior image digests and invoke the reviewed server script with those exact digests. `.release.previous.env` records the previous successful release; inspect it before use. Stop writes if data integrity is uncertain. Additive columns/tables may remain while reverting the application; do not drop them or remove policies as an emergency guess.

For database rollback, use a tested forward correction or restore the verified backup into a separate recovery project, compare integrity and perform an approved cutover. Restore is not lossless if newer writes exist; plan and reconcile the write window. Destructive down migrations are intentionally not supplied. No actual production restore/deployment has been performed in this work.
