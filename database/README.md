# Database

The database package contains Lumavok’s canonical Prisma schema, ordered SQL migrations, original Burkina Faso seeds, guarded operations and isolated tests. SQL defines the RLS policies, grants, constraints, triggers and indexes that Prisma cannot fully represent.

## Package contents

| Path | Purpose |
| --- | --- |
| `schema.prisma` | Application models and Prisma client generation |
| `migrations/` | Version-controlled schema and access-rule changes |
| `seeds/` | Preserved original Burkina Faso seed files |
| `scripts/` | Guarded migration, baseline and content operations |
| `operations/` | Reviewed SQL examples and provisioning operations |
| `tests/` | Disposable schema, authorization and preservation tests |
| `docs/`, `legacy/` | Historical design material and the earlier schema |

## Development and verification

Contributors run `npm run setup` from the repository root. From `database/`, `npm test` runs isolated SQL, seed-preservation and baseline tests. `npm run test:native` requires an explicitly disposable loopback PostgreSQL 17 environment; [Testing](../docs/TESTING.md) describes its configuration.

The original seed files remain byte-for-byte unchanged. Their guarded runner supports only an explicitly selected local, pre-expansion database. The integrated fixture is the supported dataset for current application development.

## Migration workflow

Existing databases use recovered exact historical SQL or the [reviewed baseline adoption procedure](../docs/BASELINE_AND_FREE_RESTORE.md). Fresh databases use the separate empty-schema workflow in [Deployment](../docs/DEPLOYMENT.md). Neither route rewrites applied history or authorizes production changes implicitly.

Contributors preserve applied migrations and add new reviewed migrations for justified schema changes. Shared database resets, unreviewed down migrations and `prisma db push` are outside this workflow. A schema checkpoint does not replace a complete backup.

[Schema](../docs/SCHEMA.md), [Security](../SECURITY.md) and [Architecture](../docs/ARCHITECTURE.md) describe the maintained design. Material under `docs/` in this package is historical reference rather than current setup guidance.
