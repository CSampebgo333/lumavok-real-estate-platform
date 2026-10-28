# Lumavok Real Estate Platform

[![CI](https://github.com/CSampebgo333/lumavok-real-estate-platform/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/CSampebgo333/lumavok-real-estate-platform/actions/workflows/ci.yml)

English/French property discovery and seller management for Burkina Faso. This repository consolidates the separately developed frontend, API and database into one maintained application. The original repository and its branches remain intact.

**Release status:** integrated release candidate. Local and CI verification are recorded in [TESTING.md](docs/TESTING.md). **No production deployment or production database migration has been performed.** Existing-project rollout is deliberately blocked until the two missing historical migration files are recovered and staging gates pass; see [DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Application

- Public property search, canonical cities/districts/amenities, property and seller details.
- Account registration, email confirmation, login, refresh, recovery and server session revocation through Supabase Auth.
- Account-owned favorites and viewing requests; seller appointments, notifications and analytics.
- Seller applications requiring administrator approval; localized profile and property editing with conflict detection.
- Explicit listing currency and rental period. New listings use XOF; original amounts and unknown historical metadata are preserved for reviewed curation.
- Private, validated image uploads with ownership checks and a database-enforced attachment/deletion lifecycle.
- French by default, English selectable; interface translations and database translations have separate responsibilities.

## Structure

| Directory                        | Responsibility                                                                                            |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `frontend/`                      | Next.js App Router, React, TypeScript, interface dictionaries, Vitest, Playwright                         |
| `backend/`                       | Express API, validated contracts, managed Auth bridge, scoped Prisma, Storage bridge                      |
| `database/full-database-design/` | Canonical Prisma schema, ordered SQL migrations, original Burkina seeds, SQL tests and guarded operations |
| `docs/`                          | Current architecture, audit, API, security, migration and integration documentation                       |
| `infrastructure/`                | Server configuration examples and manual deployment/rollback tooling                                      |
| `.github/workflows/`             | CI, manually approved release builds and disabled-by-default deployment                                   |

Prisma documents models; **SQL migrations are authoritative for RLS, CHECK constraints, partial indexes, security triggers and cross-schema Auth links**. Do not use `prisma db push` on a shared database.

## Prerequisites and install

Use Node **24** (`.nvmrc`), npm **11**, Git and a supported Chromium browser for E2E tests. A real environment also requires Supabase PostgreSQL 17, managed Auth and a private Storage bucket. Docker Engine with Compose v2 is required only for container operations.

```bash
git clone https://github.com/CSampebgo333/lumavok-real-estate-platform.git
cd lumavok-real-estate-platform
npm run setup
```

`setup` uses the three committed lockfiles and generates the backend Prisma client. It does not connect to or modify any database.

## Run without a cloud account

The fixture starts a new, disposable PostgreSQL implementation in memory with synthetic accounts and records. It exercises the real API, migrations, SQL, Prisma and RLS; Auth email delivery, token verification and Storage transport are simulated. It never uses production credentials or the original seed scripts.

```bash
# Terminal 1
npm run dev:fixture

# Terminal 2; open http://localhost:3000
BACKEND_API_URL=http://127.0.0.1:4100 npm run dev:web
```

Fixture accounts: `seller@example.test`, `buyer@example.test`, `admin@example.test`, `applicant@example.test`; password `FixturePassword123!`. These are public, disposable test credentials. Keep the fixture on a development machine; the production container excludes it.

## Run against a dedicated Supabase development project

1. Copy `backend/.env.example` to `backend/.env` and `frontend/.env.example` to `frontend/.env.local` locally. Inject real values with your secret manager. Never commit environment files.
2. Supply `DATABASE_URL` for a **dedicated, non-owner login inheriting only `lumavok_runtime`**. Startup rejects owner, superuser, `BYPASSRLS`, elevated memberships and `SET ROLE` sessions. Keep migration `DIRECT_URL` out of the running application.
3. Follow [DEPLOYMENT.md](docs/DEPLOYMENT.md) to provision an isolated project, run the correct migration preflight, configure managed Auth and private Storage, and verify permissions.
4. Run `npm run dev:api` and `npm run dev:web` in separate terminals. The browser uses `/api/v1` on the frontend origin; `BACKEND_API_URL` is server-only.

Do not seed an expanded or shared database using the legacy seeds. They are preserved unchanged for provenance and can run only through an explicitly enabled, local, pre-expansion guard. The disposable fixture is the supported integrated development dataset.

## Verification

```bash
npm run check          # publication secret scan, typechecks, ESLint, Prettier
npm test               # SQL, HTTP/Prisma/RLS and frontend tests
npm run build          # API TypeScript + Next.js production build
npm run audit          # all three lockfiles, including development dependencies

npm --prefix frontend exec -- playwright install --with-deps chromium
npm run test:e2e       # isolated API + production-built frontend + desktop Chromium
E2E_MOBILE=1 npm run test:e2e
```

Native PostgreSQL 17 tests require a disposable **loopback-only** instance and explicit test variables. See [TESTING.md](docs/TESTING.md). E2E accounts and data reset for each suite process; desktop/mobile run in separate CI jobs.

## Configuration and operations

[Environment and deployment](docs/DEPLOYMENT.md) describes every required variable, staging gates, image digests, TLS, health checks and rollback. CI performs no shared database writes. Release/deploy workflows require manual dispatch; deployment additionally requires a protected GitHub environment, secure SSH configuration and `DEPLOYMENT_ENABLED=true`. Database migrations remain a separate, explicitly approved operation.

No service-role key, private backup, production record export or reviewed production-content manifest belongs in this repository. A Storage credential stays server-only, separate from the ordinary database login; application-table grants to `service_role` are revoked by the security migrations.

## Documentation

- [Audit and branch decisions](docs/AUDIT.md)
- [Architecture and bilingual strategy](docs/ARCHITECTURE.md)
- [Schema, integrity and access matrix](docs/SCHEMA.md)
- [API contracts and localization examples](docs/API_CONTRACT.md)
- [Security review and residual risks](SECURITY.md)
- [Integration report](docs/INTEGRATION.md)
- [Testing and observed results](docs/TESTING.md)
- [Deployment, migration and rollback](docs/DEPLOYMENT.md)
- [Contribution workflow](CONTRIBUTING.md)
- [Source provenance](docs/consolidation/ORIGINS.md)

`docs/database-review/` retains the dated initial database audit. Earlier design documents under the database folder are historical; this README and the current documents above describe the consolidated application. The old confidential roadmap and handoff are excluded from this public repository.

No license grant has been inferred from public visibility. The repository owners should choose an appropriate license before external distribution.
