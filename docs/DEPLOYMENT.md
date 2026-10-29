# Deployment

Operators release Lumavok only after database recovery, authorization and real-provider acceptance are verified for the intended environment. Source publication and a passing CI run do not authorize production changes. The documented workflow keeps Supabase on Free and separates database migration from application deployment.

## Configuration

Real values remain in a secret manager or protected environment files outside Git. The committed examples describe the expected shape; they do not supply deployable credentials.

| Variable | Responsibility |
| --- | --- |
| `DATABASE_URL` | API-only connection for a non-owner login inheriting `lumavok_runtime`, with verified TLS/pooler settings |
| `DIRECT_URL` | Administrative connection for the separate migration process; rejected by the production API |
| `SUPABASE_URL` | Intended project URL; HTTPS in production |
| `SUPABASE_PUBLISHABLE_KEY` | Auth publishable/public key used by the API |
| `SUPABASE_STORAGE_KEY` | Server-only Storage credential, separate from database and migration logins; required in production |
| `CORS_ORIGIN` | Exact web origin, HTTPS in production, without a trailing path |
| `AUTH_REDIRECT_URL` | Approved HTTPS recovery URL, also configured in managed Auth |
| `AUTH_COOKIE_NAME` | `refresh_token` by default; must match the frontend navigation gate |
| `REFRESH_TOKEN_EXPIRES_IN_DAYS` | Cookie lifetime from 1 to 30 days, default 7; managed Auth owns session validity |
| `CONTENT_READ_MODE` | `localized` normally; `legacy` is a controlled compatibility/rollback setting |
| `TRUST_PROXY_HOPS` | Default 0; operators change it only after verifying the proxy chain and blocking bypass ingress |
| `TERMS_URL`, `PRIVACY_URL` | Frontend server-only HTTPS links to approved published legal policies |
| `PORT`, `NODE_ENV` | API port 4000 and runtime mode; production enforces secure-cookie/configuration checks |
| `BACKEND_API_URL` | Frontend server-only API target; local default `http://localhost:4000`, container build default `http://api:4000` |

Browser configuration receives no database URL or privileged key. Next.js rewrites are part of the build, so a changed API proxy target requires rebuilding the frontend. Managed TLS/pooler compatibility requires a real login test with the pinned Prisma version. Behind a proxy, a value of zero also affects per-IP rate limits; operators verify legitimate-user behavior as well as spoofing resistance.

## Database migration selection

| Migration | Purpose |
| --- | --- |
| `20260629000000_init` | Original retained baseline |
| `20261026000100_reconcile_observed_enums` | Compatible enum reconciliation |
| `20261026000200_expand_bilingual_core` | Localization, managed identity, relationships, constraints and indexes |
| `20261026000300_enforce_runtime_security` | Runtime role, RLS/grants, protected fields, sessions and counters |
| `20261028100816_integrate_media_events_and_indexes` | Notifications, indexes, asset lifecycle and service-role isolation |

Enum reconciliation precedes SQL that uses the new values. Existing identifiers, source text, amounts, media and legacy Auth fields remain preserved. The stricter district/city relationship replaces an older foreign key without discarding records.

### Existing database

The inspected Prisma history includes two applied August migrations whose original files are unavailable:

| Original file | Recorded SHA-256 |
| --- | --- |
| `20260831000001_expand_enums/migration.sql` | `d65a7b8abef1ec0a04c18da2dccaabd8e1c0d9b9f8d29a3e21c28d20f64c89e5` |
| `20260831000002_add_tables_and_columns/migration.sql` | `768cd85a9e674e8f2dd50568b26e8433e64e2eacb8320e46335422d913eee2a5` |

Operators either recover checksum-matching originals or follow [reviewed baseline adoption](BASELINE_AND_FREE_RESTORE.md). The adoption path verifies the actual target and recorded history without reconstructing historical SQL. Unknown history, unresolved failures, drift and unsupported gaps stop deployment. `npm --prefix database run migrate:preflight` remains read-only.

An actual private backup and successful isolated restore precede migration approval. Operators rehearse the additive chain, preservation checks and relevant constraints/index lock durations on the recovery target. Local timings do not establish hosted performance. Data corrections require review; migrations do not hide destructive cleanup.

### Fresh isolated database

Managed Auth must exist first. `migrate:fresh:preflight` requires an empty public application schema with `auth.users` and `auth.sessions`. The separate `migrate:fresh` command also requires explicit database/target approval references. It refuses existing application tables/history rather than deleting them.

The fresh path is not an adoption shortcut for an existing database. CI Auth/Storage stand-ins do not certify managed provisioning.

## Runtime and provider preparation

1. Operators provision a dedicated login with `NOSUPERUSER INHERIT NOBYPASSRLS NOCREATEDB NOCREATEROLE`, membership only in `lumavok_runtime` and no application-table ownership. The secret is supplied securely. Startup must pass with the actual login and intended pooler; `postgres` followed by `SET ROLE` is rejected.
2. Operators configure Auth email confirmation, SMTP, approved redirects, session lifetimes, recovery and revocation. Recovery email uses `{{ .RedirectTo }}#token={{ .TokenHash }}` with an allowlisted `/reset-password` redirect. Confirmation links retain the provider confirmation URL with an approved login redirect. Operators verify actual template/provider behavior before cutover. Historical Auth failures require fresh checks.
3. Existing accounts are linked only through a reviewed, verified identity mapping using [link-auth-identity.sql](../database/operations/link-auth-identity.sql). An unverified email or editable metadata is insufficient proof. Initial administrator assignment is a separate privileged decision.
4. Operators provision the private `property-media` bucket with the reviewed [operation](../database/operations/provision-private-storage.sql). Existing public buckets are not silently changed. Valid/invalid bytes, owner isolation, draft privacy, expiry and deletion are tested against the real service.
5. Sellers and administrators review source languages, translations, monetary terms and public contact details. `content:check` verifies a private manifest before the separately approved `content:apply` operation. Original-value preconditions prevent stale backfills. Original seeds are not run over shared data.
6. Operators verify ingress restrictions, the exact proxy chain, CORS, cookie scheme/domain, upload limits and legal-policy URLs. Only seller-approved business email is public; login addresses are not copied into contact fields automatically.

## CI and release controls

The six CI jobs cover quality/build/audit checks, native PostgreSQL, desktop/mobile browser journeys and both containers. Their databases are disposable and require no production secrets. The recorded repository controls are summarized in [Operations status](OPERATIONS_STATUS.md); operators recheck effective settings before release.

`release.yml` is manually dispatched with an exact 40-character commit and a successful CI run. The protected `release` environment and `RELEASE_ENABLED=true` gate the build/publication of commit-tagged GHCR candidates. Operators retain the resulting immutable image digests.

`deploy.yml` is also manual. The selected protected `staging` or `production` environment requires approval and `DEPLOYMENT_ENABLED=true`. Required secrets are `DEPLOY_HOST`, `DEPLOY_USER`, `SSH_PRIVATE_KEY` and `SSH_KNOWN_HOSTS`. Operators verify host keys independently and use a restricted deploy identity plus host-side registry access. Source files do not provision these settings.

The last recorded release/deployment flags were disabled. Production remains separately approved even when flags and references are populated.

## Container host

The target host receives the reviewed `compose.yml`, deployment script, private API/web environment files and approved GHCR image digests. The supplied deployment expects `/srv/lumavok/`. A TLS reverse proxy uses the Nginx location example inside an existing valid TLS server block.

The web port binds to loopback, and the API has no public host port. Compose does not create DNS, TLS certificates, managed databases, backups or secrets. The deployment script accepts only GHCR `@sha256:` references, serializes changes and records the release pointer after health checks pass. It never runs migrations.

A failed health check may leave candidate containers running. Operators inspect state and perform an explicit rollback; automatic recovery is not guaranteed.

## Acceptance and rollback

Production approval requires recorded evidence for actual backup restoration; schema/history/data preservation; restricted runtime access and denied operations; real Auth email/session flows; French/English retrieval and editing; private media ownership/expiry/deletion; reviewed legal content; monitoring; container health; proxy/TLS behavior; and rollback.

Application rollback uses previously approved image digests. `.release.previous.env` records the earlier successful release and is reviewed before use. Additive schema objects can remain during an application rollback. Operators stop writes if integrity is uncertain rather than disabling policies or dropping populated structures.

Database recovery uses a tested forward correction or restoration into a separate recovery target followed by an approved cutover. Newer writes require reconciliation. A stale backup is not lossless recovery. Destructive down migrations are not supplied, and no production restoration or deployment is established by the recorded fixture tests.
