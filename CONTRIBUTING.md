# Contributing

Use Node 24 and `npm run setup`. Create a branch from `main`; open a PR with the problem, resulting behavior, compatibility impact and actual validation. Keep changes scoped and prefer additive migrations. All normal code checks must pass before merge. Configure required CI jobs and review protection in GitHub before teammates begin shared development; configuration files do not create those settings automatically.

The canonical schema is `database/schema.prisma`; SQL migrations also contain constraints, triggers, partial indexes and RLS. Never edit an applied migration, use `db push` on shared data or synthesize missing applied history. Generate a new migration through the supported tooling and review the SQL. Test both fresh and observed schemas, ordinary runtime permissions, denied cross-account operations and rollback/recovery implications.

Preserve original Burkina seed files. Use disposable architecture/E2E fixtures for new scenarios. Never point tests at a shared or production database. Native PostgreSQL tests accept loopback hosts and explicit disposable flags only.

Add interface copy to both dictionaries with identical keys and interpolation placeholders. Localized database content uses exact-language translation rows; do not save fallback text as if authored in the requested language. Keep numeric facts and identifiers neutral. Test French and English behavior, not only dictionary presence.

Never commit `.env` files, private backups, real credentials or production-content manifests. Run `npm run scan:secrets`. Do not log request credentials, Auth tokens or provider errors containing secrets. A fake credential in a test must be clearly scoped to an isolated fixture.

Changing ownership, roles, public visibility, currency/period semantics or media lifetime requires authorization and RLS tests. Avoid static client-side permissions as the only security check. Run `npm run check`, `npm test`, `npm run build`, `npm run audit` and relevant E2E tests. A failed or unrun check belongs in the PR description.

Publishing source is separate from deploying it. Release and deployment require explicit operational approval, protected environments and completed staging/backup gates. Database migrations are never automatically run by application startup or container deployment.
