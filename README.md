# Lumavok

[![CI](https://github.com/CSampebgo333/lumavok-real-estate-platform/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/CSampebgo333/lumavok-real-estate-platform/actions/workflows/ci.yml)

Lumavok is a real estate platform for Burkina Faso, available in French and English. Users browse properties, save listings and request viewings. Sellers manage their business profiles, listings, photos and appointments. Administrators review seller applications.

The repository contains the frontend, API and database implementation. The application has passed automated integration, browser and container checks. Production release still requires an actual backup and restore rehearsal, reviewed database adoption, and acceptance checks against the intended Auth, Storage and hosting services. [Testing](docs/TESTING.md) records the verified revisions and the limits of that evidence.

## Application overview

- Property and seller catalogues with search, filters, pagination and detail pages.
- Account registration, email confirmation, sign-in, recovery and session revocation through Supabase Auth.
- Account-based favorites and viewing history.
- Seller applications, administrator approval, profile translations and listing management.
- Listing drafts, validated publication, explicit currencies and rental billing periods.
- Private image uploads, ownership checks and protected attachment/deletion workflows.
- French and English interface text, localized property content and persistent language selection.

## Architecture

Next.js serves the web interface and forwards browser requests from `/api/v1` to the Express API. The API validates requests, verifies Supabase Auth sessions and loads application permissions from PostgreSQL. Prisma queries run with transaction-local identity on a restricted database connection. Supabase Storage holds private images, which the API serves through short-lived signed URLs.

| Path | Contents |
| --- | --- |
| `frontend/` | Next.js pages, React components, translations, API clients and browser tests |
| `backend/` | Express routes, validation, authentication, authorization and service integration |
| `database/` | Prisma schema, SQL migrations, original seeds, operations and database tests |
| `scripts/` | Installation, verification, fixture startup and secret scanning |
| `docs/` | Team guides, architecture, API contracts, operations and dated records |
| `infrastructure/` | Container deployment, environment examples and reverse-proxy configuration |
| `.github/` | CI workflows, release gates and contribution templates |

The database implementation sits directly inside `database/`; the earlier wrapper directory has been removed. SQL migrations define the access rules, constraints, triggers and indexes that Prisma cannot fully express. [Architecture](docs/ARCHITECTURE.md) explains these boundaries.

## Requirements

Contributors use Node **24**, npm **11** and Git. Native database tests require an isolated PostgreSQL 17 instance and matching client tools. Browser tests require compatible Chromium binaries. Container checks require Docker Engine and Compose v2.

A connected environment also requires Supabase PostgreSQL, Auth and a private Storage bucket. Supabase remains on the Free plan; local development and database rehearsals do not require a paid project.

## Install

```bash
git clone https://github.com/CSampebgo333/lumavok-real-estate-platform.git
cd lumavok-real-estate-platform
npm run setup
```

Setup installs dependencies from the three package lockfiles and generates the backend Prisma client. It does not connect to a database or apply migrations.

## Run locally with demonstration data

The disposable fixture runs the real API, Prisma queries and database rules against synthetic records. Auth responses, email delivery and Storage transport are simulated.

```bash
# Terminal 1
npm run dev:fixture

# Terminal 2
BACKEND_API_URL=http://127.0.0.1:4100 npm run dev:web
```

The frontend opens at `http://localhost:3000`. On PowerShell, contributors set `$env:BACKEND_API_URL="http://127.0.0.1:4100"` before running `npm run dev:web`.

Fixture accounts include `seller@example.test`, `buyer@example.test`, `admin@example.test` and `applicant@example.test`. Their shared password is `FixturePassword123!`. These are public test credentials for disposable synthetic data. The fixture loses its records when its process ends and is excluded from the production API image.

## Connect development services

Contributors copy `backend/.env.example` to `backend/.env` and `frontend/.env.example` to `frontend/.env.local`. Real values stay in private local configuration or a secret manager.

| Component | Main configuration |
| --- | --- |
| Frontend server | `BACKEND_API_URL`, approved `TERMS_URL` and `PRIVACY_URL` |
| API | `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `CORS_ORIGIN`, `AUTH_REDIRECT_URL` and server-only `SUPABASE_STORAGE_KEY` |
| Separate migration process | Administrative `DIRECT_URL`, reviewed baseline and approval/backup/restore references |

The runtime database login inherits only `lumavok_runtime` and owns no application tables. The API rejects elevated connections and production migration credentials. Browser bundles receive no database URL or privileged Supabase key.

[Deployment](docs/DEPLOYMENT.md) describes the complete configuration and database preparation. After the dedicated development services are configured, `npm run dev:api` and `npm run dev:web` start the two application processes.

## Database workflow

The original Burkina Faso seed files remain unchanged. They belong to the earlier schema and are not a supported way to populate an expanded or shared database. Current development uses the separate disposable fixtures.

Existing databases follow the [baseline adoption and restore procedure](docs/BASELINE_AND_FREE_RESTORE.md). The two unavailable August migration files are never reconstructed. Operators can recover their exact originals or use the reviewed adoption workflow while preserving recorded history. New databases use the separate guarded fresh-schema path. Applied migrations are never rewritten, and shared databases are never reset through development commands.

A schema checkpoint is not a complete backup. Recovery also covers application records, Auth data, roles, configuration and Storage objects.

## French and English

French is the default. Users can switch to English; a cookie and browser storage retain their preference. Server rendering, API requests and query caches use the selected language consistently.

Interface text lives in frontend dictionaries. Property text, feature names and seller biographies use database translation rows. Public content resolves from the requested language to the configured fallback, then to the verified source language. Responses identify fallback, while editors load only the selected translation.

Identifiers, coordinates, dates and monetary amounts remain language-independent. The interface formats their presentation. Rental prices show the recorded billing period; sale prices have no recurring period. Missing historical currency or rental terms remain unconfirmed until reviewed.

## Verify changes

```bash
npm run check
npm test
npm run build
npm run audit
npm run test:e2e
E2E_MOBILE=1 npm run test:e2e
```

`check` runs the secret scan, TypeScript, ESLint and frontend formatting checks. Browser setup, native PostgreSQL requirements and CI evidence are documented in [Testing](docs/TESTING.md).

## Release status

The recorded live database has not adopted the integration migrations, and the private media bucket still requires provisioning. Actual backup recovery, managed Auth/Storage behavior, reviewed legacy content, approved legal policies, TLS/proxy configuration and rollback remain release gates.

A shared full-stack preview requires a compatible Node/container host and isolated demonstration services. The recorded preview attempt did not produce a working public URL. A static export cannot provide the protected API journeys.

Contributors work through branches and pull requests. Production migrations, disruptive access-policy changes and production deployment require separate approval. [Security](SECURITY.md), [Deployment](docs/DEPLOYMENT.md) and [Remaining work](TODO.md) define these responsibilities.

## Team documentation

The [documentation index](docs/README.md) identifies current guides, reference material and historical records. Contributors start with [Contributing](CONTRIBUTING.md) and the README for the component they maintain.

The project retains its existing [MIT license](LICENSE) and original source attribution.
