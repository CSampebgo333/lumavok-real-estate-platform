# Canonical database package

Maintain the [Prisma schema](schema.prisma) and ordered [SQL migrations](migrations/). SQL additionally enforces RLS, CHECK constraints, protected fields, partial indexes and cross-schema Auth integrity.

Use the [root setup guide](../../README.md), current [schema](../../docs/SCHEMA.md), [deployment/migration strategy](../../docs/DEPLOYMENT.md), [security review](../../SECURITY.md) and [tests](../../docs/TESTING.md). The documents under `docs/` here are historical evidence and do not supersede those references.

Run `npm test` for isolated SQL/seed-preservation and adoption-guard tests. Existing-project `migrate:preflight` accepts either recovered exact historical files or the explicitly reviewed [baseline adoption workflow](../../docs/BASELINE_AND_FREE_RESTORE.md). Neither path fabricates or replaces historical records. The separately guarded fresh-project path accepts an empty Supabase application schema only. Never use `db push`, an unreviewed down migration or a seed script against shared/production data.

All five original Burkina seed files remain byte-for-byte unchanged. The legacy runner requires an explicitly enabled local pre-expansion database. Use the integrated disposable fixture for current development rather than partially populating the expanded schema with legacy seeds.
