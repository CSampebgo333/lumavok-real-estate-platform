# Independent deployment review — 29 October 2026

## Scope and authority

The review started from `main` at `3a012063901891040dfe7f9c6aa3ea46f421911a`, using a fresh authorized clone. Earlier reports were treated as historical evidence. All five current branches were inspected. `main` contains the integrated implementation; the four alternatives change only backend dependency manifests and lockfiles. PGlite/socket updates change test infrastructure compatibility. Prisma 7 proposals update the CLI and client separately from the pinned Prisma 5 runtime/schema. No dependency branch supplies a missing application implementation, and none was merged without coordinated compatibility verification.

The existing frontend, backend, database, tooling and documentation boundaries are suitable. Historical designs, legacy Prisma schema, original seeds and consolidation inventory retain unique provenance. Mock services remain referenced testing assets rather than the runtime API. No directory move or removal was justified.

## Implemented corrections

- Recent seller listings assumed XOF for every amount. They now preserve each listing’s currency and use the reactive interface language.
- Desktop/mobile seller listing prices omitted rental periods. A shared formatter now shows recorded periods for rentals and omits them for sales. Missing currency and rental terms remain visibly unconfirmed in English/French. Public cards/details also disclose missing rental terms through the period formatter. Stored amounts and business facts remain unchanged.
- French mobile selection translated the internal `data-state="selected"` token to `sélectionné(s)`, breaking its CSS selector. The token now remains language-independent. A regression test reproduced the failure before the fix and checks French rental formatting independently of the content response language.
- Uniqueness errors exposed internal database field/index names. The API now returns a stable public conflict response; regression tests check that private metadata and provider messages are absent.
- The README now describes actual architecture, setup, adoption, bilingual behavior and release limits in named-subject prose. Stale comments about Ghana-specific regions and missing API fields were corrected. The earlier operations report points to the newly available connector evidence.

## Live Supabase evidence — read-only

The authorized connector exposes `real-estate`, ref `haxzufwizwqfrqzzzmsa`, PostgreSQL 17, status `ACTIVE_HEALTHY`. No application records or object bytes were exported. No live database, Auth, Storage, subscription or project state was changed.

- Prisma history contains successful June initialization and two August migrations, plus rolled-back August attempts. Later repository integration migrations are not applied. The Supabase migration-list endpoint returned an empty list; that endpoint does not substitute for separately queried Prisma history.
- `_prisma_migrations`, `appointment` and `appointment_history` lack RLS. Direct privilege queries returned false for `anon` SELECT/INSERT and `authenticated` SELECT on all three. The inventory’s generic public-exposure warning is not proof of effective grants; access still requires review before cutover.
- The security advisor reported fourteen tables with RLS enabled and no policies. Enabling RLS alone does not make the integrated application work. Existing version-controlled security migrations and disposable RLS tests remain the implementation path; no live policy was changed.
- No `property-media` bucket exists in live bucket metadata, and the storage-object policy query returned no policies. Real private media upload/signing remains a provisioning and acceptance prerequisite.

[Supabase RLS guidance](https://supabase.com/docs/guides/database/postgres/row-level-security) and [advisor explanation](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy) describe the grant/policy boundaries.

## Preservation and migration integrity

The baseline/free-restore workflow was inspected before changes. No historical SQL was reconstructed, applied migration edited, history reset or seed changed. A schema checkpoint is not a data backup. Existing adoption guards require independently reviewed checksums, target binding and actual backup/restore references. Database tests use disposable synthetic records. No paid resource, subscription change, project pause/deletion or production change was attempted.

## Verification record

- Clean installation from three lockfiles and Prisma client generation: passed.
- Audits: zero vulnerabilities across all three packages, including development dependencies.
- Secret scan, backend/frontend type checks, ESLint and frontend formatting: passed, including the final pre-publication run.
- Database: 11/11 passed, including fresh/observed-schema additive replay, denied cross-account operations, media lifecycle, adoption guards and byte-for-byte seed preservation.
- Backend: 4/4 passed, including HTTP/Prisma/PostgreSQL integration, image validation and new error-contract tests. The integration scenario contains many assertions but counts as one test.
- Focused pricing suite: 40/40 passed.
- Full frontend rerun: 706/706 passed across 117 files. An earlier run had 705/706 pass because the existing listing-editor autosave test exceeded its five-second timeout during a concurrent build; that failed attempt remains disclosed.
- Backend/Next.js production build: passed, including compilation, type checks, route generation and tracing.
- Local desktop browser command: all 63 cases stopped at browser launch because the required Chromium executable is absent; no local browser assertion passed. The application build/server prerequisites completed. The subsequent CI jobs supply browser binaries and passed all 63 desktop and all 63 mobile cases, including bilingual persistence, protected workflows, uploads, rental publication, responsive behavior and axe accessibility checks.
- Native PostgreSQL 17: 2/2 passed in CI, including synthetic backup/restore with verified adoption and non-owner runtime/RLS guards. This is disposable-fixture restoration, not an actual production-backup restoration.
- Both container builds and production-runtime smoke checks passed in CI. Docker and PostgreSQL executables remain unavailable locally.
- All six required jobs passed in [CI run 40947877479](https://github.com/CSampebgo333/lumavok-real-estate-platform/actions/runs/40947877479), testing implementation commit `6f7a913d0d34dab9dbfaa971394ad8d4e86f8856`. Those counts describe that implementation revision. The subsequent French mobile selection correction passes all 23 listing-table tests locally, including the newly reproduced regression; its current full-suite results are attached to the pull request. [Pull request 34](https://github.com/CSampebgo333/lumavok-real-estate-platform/pull/34) retains the required checks and review gates.

## Preview and deployment requirements

The real disposable API started successfully. Managed preview startup against the actual frontend failed before health checks: the launcher injects `--host 0.0.0.0 --port 4173 --strictPort`, while Next.js rejects `--host`. The daemon returned no working URL. No alternative tunnel or static mockup was substituted.

Sites runs Cloudflare Workers without raw PostgreSQL TCP or a general Express/Next.js Node server. It cannot host this unchanged full stack. A durable shared preview requires a compatible Node/container host and isolated demonstration database/Auth/Storage services. No working public preview or browser-verified hosted deployment is claimed.

Operators still require an actual private backup and verified isolated restore, target-specific baseline review, explicit migration approval, restricted runtime login, Auth email/redirect/recovery configuration, private Storage provisioning, reviewed bilingual content and monetary metadata, approved legal-policy URLs, TLS/proxy checks and rollback rehearsal. Production deployment and disruptive live policy changes remain separately authorized. The existing protected `main` ruleset remains untouched.
