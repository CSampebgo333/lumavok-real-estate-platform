# Web interface

The Lumavok web interface uses Next.js App Router, React and TypeScript. Users browse properties in French or English, manage their accounts and access workspaces appropriate to their roles. Browser API requests use the same-origin `/api/v1` path.

## Local development

Contributors start with the [root setup instructions](../README.md). `BACKEND_API_URL` supplies the server-side API target and defaults to `http://localhost:4000`. The disposable fixture uses `http://127.0.0.1:4100`.

From `frontend/`, the main commands are:

| Command                | Purpose                                             |
| ---------------------- | --------------------------------------------------- |
| `npm run dev`          | Start the development interface                     |
| `npm run typecheck`    | Check TypeScript                                    |
| `npm run lint`         | Run ESLint                                          |
| `npm run format:check` | Check formatting                                    |
| `npm test`             | Run unit and component tests                        |
| `npm run build`        | Build with the supported webpack production builder |
| `npm run e2e`          | Run browser journeys against the disposable fixture |

## Language and account state

French is the default. Interface resources live under `public/locales/en/` and `public/locales/fr/`; database content follows explicit `lang` requests. A persistent language preference connects server rendering, client queries and translated labels.

Access tokens stay in memory, and private query caches clear when the account or its authority changes. Navigation guards improve the user journey; the API and database enforce permission checks. Privileged credentials never belong in public variables or browser persistence.

[Architecture](../docs/ARCHITECTURE.md), [API contracts](../docs/API_CONTRACT.md) and [Testing](../docs/TESTING.md) provide the shared reference. [Remaining work](TODO.md) identifies frontend follow-up. Frontend changes follow the installed Next.js guidance in `AGENTS.md`.
