# Recovery and repository protection status

Verified on 29 October 2026. This record separates applied GitHub settings from outstanding database work. No production database migration, restore, data correction or application deployment was performed.

**Subsequent owner decision:** remain on Supabase Free and continue without requiring the unavailable historical files. The [verified adoption and free restore workflow](BASELINE_AND_FREE_RESTORE.md) provides that alternative while preserving the original history. The recovery search results below remain factual; recovering the two files is no longer the only supported path. No actual production baseline/export/restore has been completed through the new workflow.

## Repository controls applied

The active [Protect main — verified changes ruleset](https://github.com/CSampebgo333/lumavok-real-estate-platform/settings/rules/26078585) targets the default branch, currently `main`. It requires a pull request, resolution of review conversations and an up-to-date branch. Deletion and force pushes are blocked. The bypass list is empty, including for the current owner.

All six checks are required and bound to the GitHub Actions application:

- `quality`
- `browser (0)`
- `browser (1)`
- `containers (backend)`
- `containers (frontend)`
- `native-postgres`

The [environment settings](https://github.com/CSampebgo333/lumavok-real-estate-platform/settings/environments) now contain:

| Environment  | Required reviewer | Allowed ref            | Administrator bypass | Enable flag                |
| ------------ | ----------------- | ---------------------- | -------------------- | -------------------------- |
| `release`    | `CSampebgo333`    | branch `main`; no tags | Disabled             | `RELEASE_ENABLED=false`    |
| `staging`    | `CSampebgo333`    | branch `main`; no tags | Disabled             | `DEPLOYMENT_ENABLED=false` |
| `production` | `CSampebgo333`    | branch `main`; no tags | Disabled             | `DEPLOYMENT_ENABLED=false` |

These settings were saved and read back in GitHub. No deployment secrets were added, no release/deployment workflow was dispatched, and no collaborator was invited. The checked-in workflows remain manual and require their enable flag to equal `true`.

### Independent review limitation

The access page reported zero collaborators: only the repository owner has direct write access. Pull requests are mandatory, but required peer approvals are currently zero. Environment approval is a separate manual owner action; self-review prevention is not enabled because there is no second eligible reviewer. This is not independent peer review.

`CODEOWNERS` now uses the actual owner for all paths instead of names without write access and an ineffective catch-all pattern. It grants no repository access. After the owner approves and onboards a teammate, assign the appropriate component paths, require at least one independent pull-request approval and enable environment self-review prevention. Do not invent accounts, invite people without approval or add an administrative bypass to work around the gate.

## Historical migration recovery

Read-only SQL against the existing Lumavok project reconfirmed these applied migrations:

| Migration                               | SHA-256                                                            |
| --------------------------------------- | ------------------------------------------------------------------ |
| `20260629000000_init`                   | `6463d2eaa9074e955a7af437959f164a8f77c968d54c0459339fd3e97acb580a` |
| `20260831000001_expand_enums`           | `d65a7b8abef1ec0a04c18da2dccaabd8e1c0d9b9f8d29a3e21c28d20f64c89e5` |
| `20260831000002_add_tables_and_columns` | `768cd85a9e674e8f2dd50568b26e8433e64e2eacb8320e46335422d913eee2a5` |

Three earlier attempts under `20260831000000_add_appointments_admin_notifications` remain recorded as rolled back. They were not edited or removed.

Recovery checks completed:

1. Inspected all 15 original repository heads, fetched pull-request refs and 167 reachable commits. Hashed all 3,199 Git blob objects against both missing checksums, including files with different names. No match was found.
2. Inspected the private rollout archive. It contains the reviewed content manifest and preservation fingerprints, not the missing SQL or a restorable backup.
3. Inspected all 30 files in the original review package and checked their hashes. Neither historical migration is present. Its schema-only evidence is not a restore artifact.
4. Verified that `supabase_migrations.schema_migrations` does not exist in the live project. No successfully applied Prisma migration has nonempty `logs`. There were no pre-existing private or shared SQL snippets available in the current dashboard account.
5. Ran `migrate:preflight`. It exited with status 1 on the missing `20260831000001_expand_enums` file, before opening a database connection. This is the expected safety result, not a successful migration rehearsal.

If the original `migration.sql` files become available from the author's working copy or deployment artifacts, preserve their exact bytes and line endings and compare both hashes before adding them to canonical history. A matching schema cannot establish their original checksums. Recovery is optional for the reviewed adoption route; it remains required for exact historical replay. Do not fabricate replacement history, remove rolled-back records or use `migrate resolve` to bypass a mismatch.

## Managed staging and restore blockers

The dashboard confirmed that Lumavok's existing `real-estate` project is healthy on the Free plan in Ireland. Its [backup page](https://supabase.com/dashboard/project/haxzufwizwqfrqzzzmsa/database/backups/scheduled) explicitly states that the Free plan does not include project backups. There are no managed backup entries or development branches available for this rehearsal.

The new-project form refused another free project because the current account already has two active free projects across its organizations. No project was paused, deleted, upgraded or repurposed. The unrelated Maison du Faso Dan Fani project remains outside this task.

The owner declined a Pro upgrade for now. Continue on Free using a private manual export and an isolated local Supabase restore rehearsal. No upgrade, payment, resource deletion or pause is part of this plan. The hosted project quota does not prevent local testing.

The Supabase connector still cannot access the Lumavok project; its current authorization exposes another organization. Dashboard read-only access was verified through the user's selected GitHub sign-in. That does not provide a securely configured CLI/database connection for backup, restore or runtime testing.

Before a real restore rehearsal can run, configure a secure operator connection and an isolated local target. Obtain a current private backup through the supported operator workflow; do not publish database dumps, account records, private manifests or credentials in this public repository. Schema comparison alone does not validate row preservation, Storage object recovery or all Auth configuration.

## Rehearsal order and acceptance

1. Either recover and hash-check the original migrations, or review and verify the actual schema checkpoint using the adoption workflow. Preserve the old history in both cases; keep preflight fail-closed until the selected route passes.
2. Record the authorized source and distinct isolated target, backup timestamp, PostgreSQL versions and operator approval. Disable copied schedules/outbound integrations in the isolated target before testing and isolate production email and file writes.
3. Export a consistent private backup using the current Supabase backup/restore procedure; retain a checksum and inventory. Preserve application data, migration history, Auth data and role definitions as applicable. Handle role passwords and provider settings separately through secure configuration.
4. Restore only into the approved isolated target. Compare schema, constraints, migration checksums, per-table record counts and private content fingerprints before applying new migrations. Test file recovery separately; database metadata alone does not restore file bytes.
5. Run the existing-project migration preflight against that restored target, then the approved additive migrations. Measure constraint/index lock duration and validate preservation. Do not run the fresh-schema path against a restored database.
6. Run native runtime-login/RLS tests and the real Auth, Storage, EN/FR, fallback, TLS/proxy and browser acceptance checks in [DEPLOYMENT.md](DEPLOYMENT.md). Record actual outcomes and remaining failures.
7. Rehearse rollback using previous immutable application images and an isolated recovery restore. Account for writes made after the backup. Keep production disabled until the owner explicitly approves a documented cutover.

No managed staging migration, backup restore or real-provider acceptance test is claimed as passed in this record. Existing source/fixture CI evidence remains separate from these outstanding gates.
