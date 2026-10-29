# API

The Lumavok API validates requests, verifies Supabase Auth sessions and enforces account and seller permissions before accessing PostgreSQL or Storage. Express provides routing, Prisma supplies the application query interface, and SQL migrations enforce the database access model.

## Local development

Contributors install dependencies from the repository root with `npm run setup`. Connected development uses the private configuration described in [Deployment](../docs/DEPLOYMENT.md). The root `npm run dev:fixture` command provides a disposable alternative without cloud credentials.

From `backend/`, the main commands are:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development API |
| `npm run db:generate` | Generate Prisma from `database/schema.prisma` |
| `npm run typecheck` | Check TypeScript |
| `npm test` | Run HTTP, database-integration and image tests |
| `npm run build` | Compile the production API |
| `npm start` | Run the compiled API |

## Runtime responsibilities

The API requires a restricted, non-owner database login. Migration credentials remain outside the application runtime, and the Storage credential stays server-side. Every application query uses transaction-local actor context. [Architecture](../docs/ARCHITECTURE.md), [API contracts](../docs/API_CONTRACT.md) and [Security](../SECURITY.md) describe these boundaries.

`tests/e2e-server.ts` is an explicitly enabled fixture with synthetic Auth and Storage responses. It is excluded from the production image. Real-provider acceptance remains part of the [deployment procedure](../docs/DEPLOYMENT.md).
