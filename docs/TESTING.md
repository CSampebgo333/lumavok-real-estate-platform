# Verification record

This is a living record for the consolidation reviewed on 28 October 2026. Passing source checks do not imply that production was modified or that managed-provider behavior was tested. The immutable commit and CI run link in the final release record identify the exact source tested.

## Reproduce

```bash
npm run setup
npm run check
npm test
npm run build
npm run audit

# Install Chromium from the frontend directory, then run a fresh fixture process per suite.
cd frontend
npx playwright install --with-deps chromium
npm run e2e
E2E_MOBILE=1 npm run e2e
```

`npm test` includes SQL architecture/seed tests, real HTTP + scoped Prisma + PostgreSQL integration, image decoding/lifecycle tests, and frontend unit/component/API-adapter tests. Frontend service tests assert HTTP contracts rather than asserting behavior of a replacement business mock. Browser suites start the real Express API and production-built Next frontend over a disposable PostgreSQL fixture, with synthetic Auth and Storage transport. They cover navigation, locale persistence and content, auth/role boundaries, favorites, seller approval, profile edits, listing terms/upload/publication, viewings/notifications, error states, CSP, theme, keyboard operation and automated accessibility checks.

For actual PostgreSQL 17 testing, start an isolated loopback instance with a disposable administrative account, set `NODE_ENV=test`, `LUMAVOK_ALLOW_DISPOSABLE_DATABASE=1` and `LUMAVOK_NATIVE_TEST_URL`, then run `npm --prefix database/full-database-design run test:native`. The test generates its own random database/login names, verifies the runtime LOGIN/startup/RLS boundary and cleans up only those test resources. Never supply a shared database URL.

## Executed evidence

- Original Burkina seed hashes pass unchanged.
- SQL suites replay fresh and observed-schema fixtures and verify constraints, RLS, counters, multilingual lookup, asset ownership/lifecycle and internal function permissions.
- API suites execute Express + Prisma + SQL under the ordinary runtime role, including denied cross-owner operations, optimistic edits, seller approval, appointment transactions and media deletion failures/retries.
- Latest local frontend regression suite: **697/697 passed**. Publication scan, both typechecks, ESLint and Prettier passed. All three full dependency audits reported **zero vulnerabilities**, including development dependencies. The final CI result identifies the exact published source.
- Additional session tests cover single-flight refresh, stale-response rejection, account-safe retry, provider outage versus ended session and query-cache clearing on role/account changes.
- Native PostgreSQL 17 and the backend container build succeeded in CI run [40680260530](https://github.com/CSampebgo333/lumavok-real-estate-platform/actions/runs/40680260530). Other jobs in that intermediate run failed or were superseded and do not constitute a green release.
- An intermediate full desktop run exposed a fixture-only SQL return-type issue. It was corrected after direct login reproduction; all eleven desktop Auth/workflow scenarios have since passed across the corrected focused runs, including profile save and uploaded-image publication; full desktop/mobile CI results will be recorded below. Failed attempts are not counted as passing.
- Fresh dependency audit found a low-severity development-only transitive issue under the unused shadcn CLI. That generator dependency was removed; checked-in UI components do not require it. Final audits must pass for all workspaces.

## Browser and delivery verification

The complete local desktop suite passed **62/62** scenarios, including translated unknown-route handling. In CI run [40685367193](https://github.com/CSampebgo333/lumavok-real-estate-platform/actions/runs/40685367193), the earlier source passed all **60 desktop** scenarios, 697 frontend tests, SQL/API tests, dependency audits, native PostgreSQL 17 and both production container builds/smoke checks. Mobile passed 59/60 and identified a keyboard-focus omission in the horizontal analytics row. The row is now focusable and labeled in both languages. The corrected mobile analytics axe check and explicit phone keyboard-scrolling regression both passed locally (2/2).

The [CI workflow](https://github.com/CSampebgo333/lumavok-real-estate-platform/actions/workflows/ci.yml) and retained Playwright reports provide the complete per-commit desktop/mobile results for the final published candidate. The latest jobs must all be green before `main` is promoted. Failed intermediate attempts are superseded only by successful checks of corrected source.

## Limits

Local browser download from the usual Playwright CDN was unavailable. Local runs use an isolated Chromium executable supplied through `PLAYWRIGHT_BROWSER_CONFIG`; web security and CSP remain enabled. CI installs the Playwright-supported Chromium and runs desktop/mobile independently. The optional executable override is for local tooling, not part of the production runtime.

PGlite socket fixtures use a single database session and `SET ROLE`; they cannot prove that a real database LOGIN is safe. The separate successful native PostgreSQL job addresses that boundary. Native PostgreSQL and Docker were unavailable locally and were verified remotely instead.

Synthetic provider tests do not prove real Supabase email delivery, managed session revocation, Storage transport, production TLS/cookie/proxy configuration or pooler behavior. The dated live audit is not a fresh managed Auth health check. A target-project connector check on 28 October returned `INVALID_ARGUMENT`; live target state was not re-audited through that connection. No production data modification, migration, deployment, external private-media verification or restore rehearsal is reported as completed. Staging gates are in [DEPLOYMENT.md](DEPLOYMENT.md).
