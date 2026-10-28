# Lumavok API

Express, Prisma and managed Supabase Auth/Storage. Follow the [root README](../README.md), [API contracts](../docs/API_CONTRACT.md), [security review](../SECURITY.md) and [environment/deployment guide](../docs/DEPLOYMENT.md).

Use `npm run db:generate` after schema changes, then `npm run dev`, `npm run typecheck`, `npm test` and `npm run build`. Generate the client from the canonical database schema; no separate backend schema is authoritative. The API refuses elevated/owner database connections at startup. Never provide the migration URL or service-role key to browser code. The Storage credential is server-only and distinct from the ordinary SQL login.

`tests/e2e-server.ts` starts an explicitly enabled, disposable fixture with synthetic provider responses. It is not an alternate production server and is excluded from the production image. Actual managed Auth/Storage validation is still required in staging.
