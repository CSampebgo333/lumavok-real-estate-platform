# Continue without the unavailable historical SQL or a paid project

The two original August migration files are useful for exact historical replay, but they are **not required to continue development or to perform an explicitly reviewed adoption of the existing database**. Do not invent SQL under their old filenames or change their stored checksums. Their effects already exist in the database.

The owner chose to remain on Supabase Free on 29 October 2026. No plan upgrade, new paid project, project pause or production database change is authorized by this workflow.

## What adoption means here

This is an application-schema checkpoint, not a fabricated historical migration or a reset of Prisma history. The existing June/August rows, including rolled-back attempts, remain untouched. Prisma `migrate deploy` applies the subsequent reviewed migrations. The pinned Prisma CLI is tested against PostgreSQL 17 with those missing files absent.

The original strict path remains available if the files are recovered. The alternative requires:

1. The three successfully applied historical migrations to have their independently audited checksums. Only the two named August files may be absent. A different checksum, unknown applied migration, unresolved failure, duplicate applied entry or a gap in subsequent migration order is rejected.
2. A private, reviewed snapshot from the actual target, with a separately supplied SHA-256. It captures the application schema through `pg_dump`, migration status and `lumavok_runtime` role/membership metadata in one exported read-only PostgreSQL snapshot.
3. An exact match between that approved checkpoint and the target at preflight time. An altered table, index, constraint, RLS policy, grant, function, trigger or recorded history causes rejection. The endpoint is bound to host, port, database and user; passwords are omitted.
4. Separate approval, target, private backup and successful restore-test references before applying anything. A schema checkpoint alone never satisfies the backup/restore gate.

The checkpoint includes `public` and `lumavok_private`, excluding the definition of `_prisma_migrations` (its record status/checksums are checked separately). Schema ownership and grants are retained. Nonsemantic pg_dump headers and the matching outer psql restriction token are removed for comparison; SQL bodies are preserved. Use the same PostgreSQL 17 client build for capture and comparison. Unexpected dump formats and warnings cause failure.

This is not a complete platform inventory: global roles other than the application runtime role, extensions, Auth/Storage internals, provider settings, cron/outbound integrations, file bytes and application row values require separate backup and verification. Defaults and function bodies can contain sensitive literals, so the checkpoint must stay private and outside Git. The capture command refuses to overwrite a file or save inside this repository.

## Capture and review without changing the database

Install PostgreSQL 17 client tools and check `pg_dump --version`. Use a direct or session-pooler administrative connection, not a transaction pooler. Supply `DIRECT_URL` through a secure local environment or secret manager; do not paste it into chat, commit it or enable shell tracing. Remote connections must explicitly set `sslmode=require` or stronger; configure verified certificates where supported. `LUMAVOK_PG_DUMP` may point to a trusted compatible executable if it is not on `PATH`.

Choose a private directory **outside the repository**, then run:

```bash
npm --prefix database run baseline:capture -- \
  --output /private/lumavok-before.baseline.json
```

`/private/...` is an example path; use an existing access-restricted directory on the operator's machine. The command saves a new file with mode `0600` and prints only its hash and a status message. It queries migration metadata and schema, not application records. It does not authorize the schema it observes.

Review that checkpoint alongside the private backup, the current architecture and the rehearsal results. Supply its approved path as `LUMAVOK_BASELINE_FILE` and the separately reviewed hash as `LUMAVOK_BASELINE_SHA256`. Do not automatically trust a freshly calculated hash or recapture a changed database merely to silence a drift error.

```bash
npm --prefix database run migrate:preflight
```

With those two variables, this uses verified adoption. Without them, it retains the strict original-file path. Both commands are read-only. No `migrate resolve`, fake historical SQL, direct history-table update or reset is needed.

## Free backup and restore rehearsal

A Pro subscription is not required for a manual database export or an isolated local restore. The account's two-project limit applies to hosted free projects; it does not prevent a local Docker/Supabase environment. The [Supabase platform-to-self-hosted restore guide](https://supabase.com/docs/guides/self-hosting/restore-from-platform) documents the supported procedure.

1. Prepare an isolated local Supabase stack with compatible PostgreSQL 17, extensions, Auth and Storage schema versions. Keep it bound to loopback and block production email, scheduled jobs, webhooks and other outbound integrations before importing data. Use fresh local credentials. This is a development/recovery environment, not a public production deployment.
2. Use the current Supabase CLI's documented `db dump` workflow to export roles, schema and data to private files. Check `supabase --version`, `supabase db dump --help` and the official restore guide for the installed version. Use secure connection injection on the operator machine. Do not use this application's schema-only checkpoint as the backup.
3. Retain hashes, export times and a private inventory. Coordinate schema changes and writes so the separate export files represent a consistent recovery point. Verify that application records, migration history and Auth data are included. Custom role passwords, provider configuration and Storage object bytes need separate secure handling.
4. Restore into the new local target only, following the supported Supabase filtering and restore procedure. Do not blindly restore an unfiltered full platform `pg_dump` over an existing Supabase instance. Verify versions and dependencies rather than deleting incompatible data to make the restore pass.
5. Point the securely supplied `DIRECT_URL` at that local target and run `baseline:compare` with the approved source checkpoint. This explicitly permits a different endpoint but remains read-only. It checks application schema/history/runtime-role metadata only. Separately compare per-table counts, stable private content fingerprints, Auth rows and file bytes. Different source/local ownership or role metadata must be explained and reviewed; the tool does not silently ignore it.
6. Capture and review a new **target-specific** checkpoint for the restored local database. Run `migrate:preflight`, then the approved additive migrations there. Verify English/French retrieval, fallback, permissions and preservation of original titles, descriptions, prices and rental metadata. Original Burkina seed files remain unchanged and must not be run over restored data.
7. Record the successful local rehearsal and limitations. A local restore can validate the backup and SQL path; it does not certify Supabase-hosted email delivery, managed Storage configuration, TLS/proxy behavior or production performance. Those checks remain explicit release requirements. No paid staging project is mandatory for the local step.

The current session has no securely configured operator connection for a full production export. No actual production backup/restore is claimed. The read-only dashboard inspection and synthetic CI restore are different evidence.

## Applying after a successful rehearsal

Keep the target under an operator-controlled schema-change window between preflight and deployment. Prisma's own migration lock remains enabled; it does not stop unrelated dashboard/manual DDL. Never run two operators' schema changes concurrently.

In addition to `DIRECT_URL` and the two baseline variables, the apply command requires these references in the secure environment:

| Variable                         | Meaning                                                                        |
| -------------------------------- | ------------------------------------------------------------------------------ |
| `LUMAVOK_BASELINE_APPROVAL`      | Review of this exact checkpoint and the adoption decision                      |
| `LUMAVOK_DATABASE_APPROVAL`      | Explicit permission for the concrete target and pending migrations             |
| `LUMAVOK_TARGET_PROJECT`         | Intended project/local recovery target identifier                              |
| `LUMAVOK_BACKUP_REFERENCE`       | Verified private backup and inventory                                          |
| `LUMAVOK_RESTORE_TEST_REFERENCE` | Actual successful restore/preservation rehearsal, not an unrelated fixture run |

```bash
npm --prefix database run migrate:deploy
```

Setting variables is not user authorization. Production still requires separate explicit approval; it has not been granted for this change. The command uses Prisma to append new migration records and never changes the original history entries. If deployment fails or is interrupted, inspect status and preserve the evidence. Partial migration state or schema drift blocks a retry until reviewed. Never mark an unsuccessful migration applied to bypass the gate.

After a successful deployment, preserve the before checkpoint and capture/review a new after checkpoint for subsequent changes. The old checkpoint intentionally becomes stale. Future preflight with the reviewed after checkpoint is idempotent when no migrations remain.

## Verification and boundaries

Unit tests cover missing/changed/unknown history, failed and duplicate entries, ordering, target binding, schema/history/role drift, artifact integrity, private file handling and approval guards. The native PostgreSQL test creates two disposable loopback databases, backs up/restores synthetic legacy records with `pg_dump`/`psql`, compares the baseline, detects deliberate drift, applies the actual four subsequent migrations through the pinned Prisma CLI, and checks that original records and historical migration rows are preserved. It then verifies a reviewed after checkpoint permits a no-op deployment.

This fixture test is part of the existing required `native-postgres` CI job. Its result must be read from the current CI run; adding the test does not mean it passed. It requires matching `pg_dump` and `psql` executables (or trusted `LUMAVOK_PG_DUMP`/`LUMAVOK_PSQL` paths). CI uses clients from its disposable PostgreSQL 17 service.

References: [Prisma deployment behavior](https://www.prisma.io/docs/orm/v6/prisma-migrate/workflows/development-and-production), [PostgreSQL pg_dump](https://www.postgresql.org/docs/17/app-pgdump.html), [Supabase manual backup/restore](https://supabase.com/docs/guides/self-hosting/restore-from-platform). The repository pins Prisma 5.20.0; its actual behavior is verified in the native test instead of assuming current documentation alone proves compatibility.
