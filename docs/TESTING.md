# Testing

Verification covers application behavior, database integrity and delivery configuration. Each result belongs to a specific revision and environment. Passing fixture tests does not establish production deployment or real-provider acceptance.

## Standard checks

Contributors run these commands from the repository root:

```bash
npm run setup
npm run check
npm test
npm run build
npm run audit
```

Setup installs the three lockfiles and generates the backend Prisma client. `check` runs secret scanning, backend/frontend TypeScript, ESLint and frontend formatting. Tests exercise SQL/RLS, HTTP/Prisma integration, image validation and frontend behavior. Builds compile the API and the production Next.js application. Audits include runtime and development dependencies.

## Browser journeys

```bash
cd frontend
npx playwright install --with-deps chromium
npm run e2e
E2E_MOBILE=1 npm run e2e
```

Each suite starts a real Express API and production-built Next.js frontend over disposable PostgreSQL fixtures. Auth responses, email delivery and Storage transport are synthetic. Desktop and mobile run separately, with new fixture processes per suite.

Coverage includes navigation, language persistence and database content, authentication, role boundaries, favorites, seller approval, profile edits, draft persistence, currencies/rental periods, uploads/publication, viewings, notifications, visible failures, CSP, appearance preferences, keyboard operation and automated accessibility checks.

`PLAYWRIGHT_BROWSER_CONFIG` can supply an approved local executable configuration where needed. CI installs the supported Chromium build. Missing browser binaries or a failed browser launch are environment failures, not passing application assertions. Axe checks complement manual accessibility review; they do not certify every accessibility requirement.

## Database tests

`npm --prefix database test` replays fresh and observed-schema fixtures. Tests verify constraints, publication rules, translation fallback, account isolation, protected roles/ownership, media lifecycle, original seed hashes and migration/adoption guards.

Native PostgreSQL 17 checks require a loopback-only disposable instance, matching PostgreSQL client tools and these explicit settings:

| Variable | Requirement |
| --- | --- |
| `NODE_ENV` | `test` |
| `LUMAVOK_ALLOW_DISPOSABLE_DATABASE` | `1` |
| `LUMAVOK_NATIVE_TEST_URL` | Administrative connection to the isolated loopback instance |

```bash
npm --prefix database run test:native
```

The tests create randomly named databases/logins and clean up their own resources. They verify a real restricted-login startup boundary, denied privilege escalation, RLS and protected fields. The baseline test exports/restores synthetic legacy records, detects drift, applies the additive chain and checks history/data preservation and a reviewed no-op deployment.

This is disposable-fixture restoration. It is not restoration of a production backup. PGlite socket tests use a shared session and role switching, so the native login test covers a boundary they cannot establish. [Baseline adoption and restore](BASELINE_AND_FREE_RESTORE.md) defines the actual recovery workflow.

## CI jobs

| Job | Responsibility |
| --- | --- |
| `quality` | Setup, quality checks, SQL/API/frontend tests, production builds and audits |
| `native-postgres` | PostgreSQL 17 login, authorization and synthetic restore/adoption |
| `browser (0)` | Desktop browser and accessibility workflows |
| `browser (1)` | Mobile browser and accessibility workflows |
| `containers (backend)` | API image build and production dependency smoke test |
| `containers (frontend)` | Web image build and production startup smoke test |

All six jobs are required by the recorded `main` protection rules. The current pull request and its exact commit checks determine merge readiness.

## Recorded evidence

| Revision | Verified result |
| --- | --- |
| [`df039e0`](https://github.com/CSampebgo333/lumavok-real-estate-platform/commit/df039e008d67bacce20787e35c6b730dc45e519f) | [All six jobs passed](https://github.com/CSampebgo333/lumavok-real-estate-platform/actions/runs/40949359751): 707 frontend tests in 117 files, 11 database tests, 4 backend tests, 2 native PostgreSQL tests, 63 desktop and 63 mobile browser cases, both container checks and zero reported audit vulnerabilities. |
| [`87c016c`](https://github.com/CSampebgo333/lumavok-real-estate-platform/commit/87c016cea6e872310abff2355a151ccf65dcf847) | [All six jobs passed](https://github.com/CSampebgo333/lumavok-real-estate-platform/actions/runs/40952183902) after flattening the database package. Separate SHA-256 comparisons preserved all 15 seed, migration and operation files; 45 changed-document links resolved. |

An earlier local frontend run hit an autosave-test timeout; a fresh full run and later CI passed. Local browser attempts without Chromium stopped before assertions. These attempts remain in [earlier verification records](archive/testing-history.md) and the [application review](INDEPENDENT_REVIEW.md); they are not counted as successful browser checks.

## Acceptance outside CI

Operators still verify actual backup recovery, Auth email/redirect/recovery and revocation, private Storage access and expiry, intended pooler behavior, TLS/proxy cookies and rollback. Synthetic provider responses and dated live observations cannot replace those checks. Production load, full manual accessibility review and the shared preview host also remain outside the recorded fixture evidence. [Deployment](DEPLOYMENT.md) lists the acceptance gates.
