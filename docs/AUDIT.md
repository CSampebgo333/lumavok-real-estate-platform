# Audit and consolidation decisions

Audit evidence combines the initial read-only Supabase inspection (26 October 2026), independently inspected Git branches, source reproduction, disposable SQL/HTTP tests and browser verification. A dated snapshot is not a claim about the current live service. No production records or private backup are included here.

## Initial database evidence

The inspected Lumavok Supabase project had PostgreSQL 17.6, 17 public tables including migration history, 9 properties (7 ACTIVE/2 DRAFT), 4 users/seller profiles, 2 Burkina cities, 7 districts, 10 features, 8 media references and 22 legacy refresh records. Auth users, Storage buckets and Storage objects were empty. Auth health returned 5xx during that inspection. The full dated audit remains in [database-review/AUDIT.md](database-review/AUDIT.md).

RLS was enabled on fourteen tables with no policies; application access grants were denied, while appointment/history/migration metadata lacked complete RLS coverage. This was neither a usable application-access model nor proof of production security. The original schema provided useful relationships, decimal prices, normalized locations, amenities, favorites and business identities, but lacked localized content, explicit currency/period semantics, verified managed-Auth links and complete database enforcement of several relationships.

Applied August migration names existed in the live history without their original files in the inspected branches. Recreating a similar migration or marking invented SQL as already applied would destroy confidence in replay. Existing-project deployment is blocked until original checksummed files are recovered.

## Branches were reviewed independently

The [machine-readable inventory](consolidation/branch-inventory.json) pins all fifteen branch heads and their differences; [ORIGINS.md](consolidation/ORIGINS.md) identifies the reviewed integration baseline.

| Source                                                  | Findings and disposition                                                                                                                                                                                          |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dba`                                                   | Retain CUID identities, normalized locations, decimal data, useful entities and every Burkina seed byte. Expand relationships, constraints, multilingual content and least-privilege policies through migrations. |
| `feature/claude-frontend`                               | Retain pages, component system, seller dashboard and UX. Replace mocks and fabricated defaults with actual API calls, canonical IDs, explicit monetary metadata and server errors.                                |
| `feature/APP-002-french`                                | Retain language preference and frontend dictionary approach. Complete untranslated paths and add independent database-content localization. A translated interface does not translate records.                    |
| `master`, `develop`                                     | Compare independently; neither contains a complete integrated release. Retain useful shared foundations without assuming branch synchronization.                                                                  |
| `feature/APP-001-auth-endpoints`, `setup/APP-000-files` | Compare the alternate local-JWT/Auth design. Reject client-selectable registration roles and a second password/session authority; consolidate on managed Auth plus fresh database authorization.                  |
| `feature/prisma_test`                                   | Use historical schema/test intent as evidence. Old integration tests could write to a configured database; replace with explicit disposable fixtures.                                                             |
| Two `review/lumavok-*` branches                         | Use reviewed additive SQL and API integration as consolidation baseline; extend them for media lifecycle, workflows, complete translation and deployment checks.                                                  |
| Five Dependabot branches                                | Inspect proposed updates separately. Do not merge incompatible major changes blindly; retain audited lockfile resolutions. Next security fixes supersede the older proposed update.                               |

The historical environment blob checked during review contained placeholder patterns, not a confirmed active credential disclosure. It was not copied into the new repository. The publication scanner and ignored environment-file rules guard future changes; a pattern scan is not proof that every possible secret is absent.

## Problems corrected in the consolidated source

- Frontend and backend contracts disagreed on casing, route shapes, filters, favorites, appointment transitions and authentication roles. Contract adapters and HTTP tests now exercise the actual API.
- Public UI and dashboard used mock/partial translations; language selection did not consistently drive database text or page metadata. Dictionaries, server reads and localized APIs are now aligned.
- Missing Auth identity mapping, stale claims, overly privileged database connections and ambiguous RLS boundaries are replaced by verified managed identity, fresh roles, session revocation checks, column grants and scoped transactions.
- Inconsistent district/city and appointment/property/seller combinations, dangling report targets, duplicate favorites/translations and unsafe media deletion are enforced at the database boundary.
- Public/owner boundaries, seller activation, canonical locations, exact-language edits, favorites and buyer viewings are implemented end to end.
- Unbounded dashboard/list retrieval and in-memory aggregation are replaced with bounded SQL queries. API outages no longer silently become empty lists or 404s.
- Photo removal previously attempted storage deletion before a listing save. The lifecycle registry now protects attached assets and form removal preserves persisted media.
- Refresh races and account/role cache reuse are covered by regression tests. Logout reports failed revocation without pretending the server session ended.
- Placeholder deployment workflows are replaced with tested CI configuration and manually gated release/deploy tooling. No deployment has been dispatched.

## Preserved and deliberately deferred

Original repositories/branches, existing data, original prices/descriptions/media, legacy Auth/password columns and all five Burkina seed files are retained. Unknown source language, currency and rent terms remain unclassified until an approved content manifest is applied. New migrations are additive to domain data; no legacy table/column is dropped. Old confidential roadmap/handoff material is excluded from public consolidation and remains in its original source.

Payments, billing, messaging, vendor translation, automated orphan cleanup, abuse-resistant analytics ingestion and a public rating/report workflow are not fabricated as complete features. Existing tables for the latter are protected and retained, but no unsupported product promise is made. Branch and environment protections are configured, with independent peer review awaiting teammate onboarding. Migration-history recovery, actual managed Auth/Storage validation, a restore rehearsal and explicit production approval remain release gates; see [OPERATIONS_STATUS.md](OPERATIONS_STATUS.md), [TESTING.md](TESTING.md) and [DEPLOYMENT.md](DEPLOYMENT.md).
