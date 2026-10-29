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

- Consolidation commit `7edfdc62a7f3eb7f34cf86556f61d199633c09e4` passed all six jobs in [CI run 40686920541](https://github.com/CSampebgo333/lumavok-real-estate-platform/actions/runs/40686920541): 697 frontend tests, 6 SQL/seed tests, 2 backend tests, native PostgreSQL 17 verification, 63 desktop and 63 mobile scenarios, all dependency audits, and both production container builds/smoke checks.
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

## Reconciliation with merged dependency updates

While consolidation was being verified, `main` advanced to `ab3cdcadfc2b89fa2e6c5d92c3491aa4791297cd` through reviewed dependency merges. The reconciliation preserves that commit as a merge parent and keeps the updated packages. React and React DOM are aligned at 19.3.1, Vitest and its coverage provider at 5.0.5, with compatible Node types. Dependabot groups these coupled packages to reduce future partial upgrades. GitHub Actions v7 updates remain pinned to immutable commit SHAs.

Express 5 requires named wildcard routes; the synthetic image transport now handles its path segments correctly. Startup handles the listen callback's error argument. Query parsing is explicitly flat, and HTTP regression checks reject duplicate values and bracketed array/object syntax so malformed filters cannot be silently ignored. All source, browser, native PostgreSQL and container jobs must pass again for this reconciled candidate; the earlier green run alone does not certify the dependency changes.

Local reconciliation checks passed: 697 frontend tests, 6 SQL/seed tests, 2 backend tests, both typechecks and production builds, ESLint, formatting, secret scanning and three dependency audits with zero vulnerabilities. The Chromium download remained unavailable locally; the reconciled browser and container evidence is supplied by the candidate's CI jobs.

Coverage generation also passed on reconciliation commit `4cd2e202b71840fe349db784f4d68aad28d99697`: 77.24% statements, 72.55% branches, 72.22% functions and 78.45% lines in the configured frontend scope. These are unit/component metrics, not a claim of complete coverage or managed-provider verification.

That commit passed all six jobs in [PR CI run 40716552260](https://github.com/CSampebgo333/lumavok-real-estate-platform/actions/runs/40716552260), but the independent push run exposed an intermittent mobile keyboard-scrolling failure (62/63 passed). Native arrow increments could leave the mandatory snap row at the same card. Keyboard navigation now targets whole cards and supports Home/End; the browser regression waits for loaded statistics and verifies both directions and both endpoints. This correction requires another green full CI run before promotion; the intermittent failure was not dismissed by rerunning unchanged code.

## Subsequent verified source and operational checks

The keyboard correction on `dabf47f9e744b7d52acbdcfa2d7188243de4069f` passed all six jobs in both [push CI 40718674790](https://github.com/CSampebgo333/lumavok-real-estate-platform/actions/runs/40718674790) and [PR CI 40718692335](https://github.com/CSampebgo333/lumavok-real-estate-platform/actions/runs/40718692335), and was promoted to `main`. Subsequent user-merged dependency updates through `fe6b34ab246d528f5d038ef18cd66e2ed5901d61` passed [CI 40780725517](https://github.com/CSampebgo333/lumavok-real-estate-platform/actions/runs/40780725517). The operational follow-up is based on that newer source and preserves those dependency changes.

On 29 October, the active branch ruleset was read back through GitHub's API. Required-reviewer, main-only branch and no-bypass controls were saved and verified for all three environments, and each enable flag was explicitly set to `false`. No deployment was triggered to test the gates. Read-only Supabase SQL reconfirmed historical migration checksums and the absence of another migration SQL store. The existing-project preflight failed as intended on the first missing historical file. All six database tests passed, including byte-for-byte Burkina seed preservation and the missing-history and production-seeding guards. The secret scan passed across 558 first-party text files, and `git diff --check` passed. [OPERATIONS_STATUS.md](OPERATIONS_STATUS.md) records the recovery searches and the free-plan staging/backup blockers; none is reported as a successful managed restore.

## Baseline adoption and free restore workflow

The owner chose to continue without fabricated historical SQL or a Pro upgrade. The new adoption guards passed all 11 local database tests, covering audited checksums, unresolved/duplicate history, migration order, schema/history/role drift, target binding, reviewed artifact hashes, private file handling, approval guards and unchanged Burkina seeds. The production connection was not used.

The required native PostgreSQL job now also runs a real `pg_dump`/`psql` restore of synthetic legacy records, checks the restored schema/history, and applies the subsequent migrations using the pinned Prisma CLI while the two historical files remain absent. It verifies record/history preservation, rejection of drift and an idempotent no-op after a reviewed post-change checkpoint. CI supplies matching PostgreSQL client tools from its disposable service; results are recorded in the PR's required CI run. This is not a backup/restore of Lumavok production or a managed Auth/Storage acceptance test. See [BASELINE_AND_FREE_RESTORE.md](BASELINE_AND_FREE_RESTORE.md).

## Limits

Local browser download from the usual Playwright CDN was unavailable. Local runs use an isolated Chromium executable supplied through `PLAYWRIGHT_BROWSER_CONFIG`; web security and CSP remain enabled. CI installs the Playwright-supported Chromium and runs desktop/mobile independently. The optional executable override is for local tooling, not part of the production runtime.

After workspace recovery, the replacement local Chromium exited before any browser scenario could run. Those attempted keyboard regression runs are not counted as passes. The corrected source passed typechecking, lint, formatting and its existing stats component tests locally; full browser verification uses CI's supported browser.

PGlite socket fixtures use a single database session and `SET ROLE`; they cannot prove that a real database LOGIN is safe. The separate successful native PostgreSQL job addresses that boundary. Native PostgreSQL and Docker were unavailable locally and were verified remotely instead.

Synthetic provider tests do not prove real Supabase email delivery, managed session revocation, Storage transport, production TLS/cookie/proxy configuration or pooler behavior. The dated live audit is not a fresh managed Auth health check. A target-project connector check on 28 October returned `INVALID_ARGUMENT`; live target state was not re-audited through that connection. No production data modification, migration, deployment, external private-media verification or restore rehearsal is reported as completed. Staging gates are in [DEPLOYMENT.md](DEPLOYMENT.md).
