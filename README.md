# Lumavok Real Estate Platform

[![CI](https://github.com/CSampebgo333/lumavok-real-estate-platform/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/CSampebgo333/lumavok-real-estate-platform/actions/workflows/ci.yml)

Lumavok supports property discovery and seller management in Burkina Faso in French and English. Users browse listings, save properties and request viewings. Agents manage their profiles, translations, listings, photos and appointments. Administrators review seller applications.

This repository is the application’s single source of truth. **Production deployment remains blocked pending a verified backup/restore, migration adoption and real-provider acceptance checks.** Existing test reports describe their recorded revisions; [the independent review](docs/INDEPENDENT_REVIEW.md) records the current work and its verification limits.

## Architecture and capabilities

The Next.js App Router frontend sends browser requests to the same-origin `/api/v1` proxy. The Express API validates inputs, verifies Supabase Auth sessions, establishes request-scoped database identity and queries PostgreSQL through Prisma. Supabase Storage holds private property images; the API validates image bytes and ownership and returns short-lived signed URLs.

The application supports public property and agency pages, canonical locations and amenities, account favorites and viewing history, seller applications and approval, listing drafts and publication, profile translations, notifications and analytics. Loading, empty, validation and failure states form part of these journeys.

| Path | Responsibility |
| --- | --- |
| `frontend/` | Next.js pages, components, hooks, services, interface dictionaries, unit and browser tests |
| `backend/` | Express API, Auth and Storage bridges, scoped Prisma queries and integration fixtures |
| `database/` | Canonical Prisma schema, additive SQL migrations, preserved Burkina Faso seeds and guarded operations |
| `scripts/` | Lockfile installation, verification orchestration, fixture startup and secret scanning |
| `docs/` | Architecture, API contracts, database adoption, deployment and dated review evidence |
| `infrastructure/` | Environment examples, Compose support, Nginx example and release tooling |
| `.github/workflows/` | Quality, database, browser, container and manually gated release/deploy workflows |

SQL migrations are authoritative for RLS, grants, constraints, triggers and partial indexes. Prisma describes application models. Historical database designs, migration assets and source provenance remain in their existing paths; [ORIGINS.md](docs/consolidation/ORIGINS.md) explains their purpose. The current structure already separates application, database, tooling and documentation responsibilities; the database package now sits directly under `database/`, with all schema, migration, seed, test and operation files immediately accessible. The redundant wrapper README was consolidated into `database/README.md`. Scripts, Prisma generation, Docker paths, CI and documentation follow the flattened layout. Historical branch inventories and original-source links retain their recorded paths.

## Prerequisites and clean installation

Contributors use Node **24**, npm **11** and Git. Real service integration requires Supabase PostgreSQL 17, Auth and a private Storage bucket. Native database tests require an explicitly disposable loopback PostgreSQL 17 instance with matching client tools. Container checks require Docker Engine and Compose v2.

```bash
git clone https://github.com/CSampebgo333/lumavok-real-estate-platform.git
cd lumavok-real-estate-platform
npm run setup
```

Setup installs the three committed lockfiles and generates the backend Prisma client without connecting to a database. Each package retains its existing lockfile; contributors avoid mixing package managers.

## Local execution with synthetic data

Contributors can run the real API and frontend against an isolated in-memory PostgreSQL fixture without cloud credentials:

```bash
# Terminal 1
npm run dev:fixture

# Terminal 2; frontend listens on http://localhost:3000
BACKEND_API_URL=http://127.0.0.1:4100 npm run dev:web
```

On PowerShell, the second terminal uses `$env:BACKEND_API_URL="http://127.0.0.1:4100"` followed by `npm run dev:web`.

Fixture accounts include `seller@example.test`, `buyer@example.test`, `admin@example.test` and `applicant@example.test`, with password `FixturePassword123!`. These public demonstration credentials authorize only synthetic, disposable fixture records. The fixture exercises Express, Prisma, SQL migrations and RLS, while simulating Auth responses, email delivery and Storage transport. Data disappears when the fixture process ends. It is a local test environment, not a production backup restoration or a durable shared preview.

## Environment and dedicated development services

Contributors copy `backend/.env.example` to `backend/.env` and `frontend/.env.example` to `frontend/.env.local`, then inject service configuration through a secret manager or private local environment.

| Environment | Required configuration |
| --- | --- |
| Frontend server | `BACKEND_API_URL`; approved `TERMS_URL` and `PRIVACY_URL` for registration |
| API runtime | `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `CORS_ORIGIN`, `AUTH_REDIRECT_URL`; server-only `SUPABASE_STORAGE_KEY` for uploads |
| API operational settings | `PORT`, `NODE_ENV`, `AUTH_COOKIE_NAME`, refresh-token lifetime, verified `TRUST_PROXY_HOPS`, `CONTENT_READ_MODE` |
| Separate migration process | Administrative `DIRECT_URL` and the reviewed baseline, backup, restoration and target approval references |

The runtime database login inherits only `lumavok_runtime`; startup rejects ownership, superuser, `BYPASSRLS`, elevated membership and role-switching sessions. Migration credentials remain outside the runtime. Production configuration requires HTTPS and a Storage credential. No privileged value belongs in `NEXT_PUBLIC_*`, browser bundles, logs, documentation or Git.

After isolated service provisioning and the reviewed database setup, contributors start `npm run dev:api` and `npm run dev:web` in separate terminals. Browsers use the frontend origin; the API origin remains a server-side proxy target.

## Database setup and preservation

Operators select the fresh-database or existing-database workflow in [DEPLOYMENT.md](docs/DEPLOYMENT.md). The original August migration SQL is unavailable; [BASELINE_AND_FREE_RESTORE.md](docs/BASELINE_AND_FREE_RESTORE.md) documents verified adoption without fabricated history. Its schema checkpoint does **not** replace a full backup of records, Auth, roles, provider settings and Storage objects.

Original Burkina Faso seed files remain byte-for-byte preserved. They are historical, pre-expansion assets and are unsuitable for an expanded/shared database. New test records belong in separate disposable fixtures. Applied migrations and migration-history records remain unchanged; justified schema changes use reviewed additive migrations tested in isolated environments. Shared database resets and `prisma db push` are prohibited.

Supabase remains on Free. A private manual export and local restore rehearsal can support recovery testing without a paid hosted project. Production migrations require separate explicit approval after a successful actual backup/restore rehearsal.

## English and French behavior

French is the default. Users select English or French; the language cookie persists for one year and local storage retains the browser preference. Server rendering reads the cookie, while client requests send an explicit `lang`. Query keys distinguish languages.

Static interface copy belongs in the frontend dictionaries. Database content uses separate translation rows. Published content resolves in requested-language, configured-fallback, then source-language order; response metadata identifies fallback. Editors load the exact selected translation and never overwrite a fallback row as if it were authored in another language.

Identifiers, coordinates, amounts and dates remain language-independent. Presentation formats dates and currency according to the selected language. Sale amounts have no recurring period; rental amounts show their recorded day, week, month or year. Unknown historical currency or rental terms remain visibly unconfirmed rather than receiving invented business facts.

## Verification

```bash
npm run check          # secret scan, TypeScript, ESLint and frontend formatting
npm test               # SQL/RLS, HTTP/Prisma and frontend regression tests
npm run build          # backend compilation and Next.js production build
npm run audit          # all three lockfiles, including development dependencies
npm run test:e2e       # desktop browser workflows against the disposable fixture
E2E_MOBILE=1 npm run test:e2e
```

The browser runner requires a compatible Chromium installation. Contributors install it with `npm --prefix frontend exec -- playwright install --with-deps chromium` where the environment supports browser installation. Native PostgreSQL test flags, fixture boundaries, accessibility checks and CI jobs are documented in [TESTING.md](docs/TESTING.md). Unrun checks and failed prerequisites remain explicit in review reports.

## Security, deployment and known limitations

The API verifies identity and ownership; navigation guards do not authorize database operations. SQL enforces actor-scoped RLS and protected fields. Storage credentials stay server-side, uploads are re-encoded, and attachment/deletion rules protect references. [SECURITY.md](SECURITY.md) describes remaining operational risks.

[DEPLOYMENT.md](docs/DEPLOYMENT.md) covers immutable container images, runtime secrets, TLS, proxy configuration, health checks, approved migrations and rollback. Application startup and deployment do not migrate databases automatically. Protected-branch review and required CI checks remain in force; production deployment and disruptive live policy changes require separate approval.

A full-stack shared preview requires a Node-compatible frontend/API host plus isolated database, Auth and Storage services. Sites Workers cannot directly host this Express/Prisma/PostgreSQL stack: their runtime lacks raw PostgreSQL TCP and is not a general Node server. A static export cannot provide the protected journeys. No public preview or production readiness is claimed without actual hosting and browser verification.

The live Supabase schema has not adopted the repository’s integration migrations. Actual backup restoration, real Auth/email and private Storage acceptance, reviewed content curation, legal-policy URLs, hosted proxy/TLS behavior and production rollback remain release prerequisites. Synthetic fixture tests do not certify those services.

## Further documentation

- [Independent implementation review](docs/INDEPENDENT_REVIEW.md)
- [Architecture and bilingual strategy](docs/ARCHITECTURE.md)
- [Schema and access matrix](docs/SCHEMA.md)
- [API contracts](docs/API_CONTRACT.md)
- [Baseline adoption and free restore](docs/BASELINE_AND_FREE_RESTORE.md)
- [Testing](docs/TESTING.md), [deployment](docs/DEPLOYMENT.md) and [contribution workflow](CONTRIBUTING.md)
- [Earlier integration evidence](docs/INTEGRATION.md) and [source provenance](docs/consolidation/ORIGINS.md)

The project retains the existing [MIT license](LICENSE), copyright Emmanuel Adoum.
