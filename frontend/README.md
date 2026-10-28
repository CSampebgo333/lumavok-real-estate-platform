# Lumavok frontend

Next.js App Router and TypeScript interface. Start with the [root setup instructions](../README.md), [API contract](../docs/API_CONTRACT.md), [architecture](../docs/ARCHITECTURE.md) and [tests](../docs/TESTING.md).

Run `npm run dev` locally; `BACKEND_API_URL` supplies the private API origin and defaults to `http://localhost:4000`. Browsers always call `/api/v1`. `npm run build` uses the supported webpack production builder. `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm test` and `npm run e2e` are the local checks. Root scripts install dependencies and generate the backend client in the correct order.

French is the default. Interface resources are under `public/locales/en` and `fr`; database content is localized through explicit `lang` requests and translation rows. Never store credentials in public variables or browser persistence. Access tokens live in memory and private query caches clear when accounts or authority change. See root documentation for deployment, CSP, private media and Auth behavior.

`AGENTS.md` applies to frontend changes: consult this installed Next version's bundled documentation before changing framework integrations.
