# Security

Lumavok protects account, seller and property data through server validation, restricted database access and row-level authorization. These controls apply to the version-controlled implementation; operators verify their effective behavior on the intended service environment before release.

## Reporting vulnerabilities

Contributors report suspected vulnerabilities privately to the repository maintainers through an established private channel. Public issues must not contain credentials, private records or sensitive exploit details. A dedicated reporting address and response-time commitment have not been published.

## Security boundaries

| Boundary | Control |
| --- | --- |
| Identity | Supabase verifies bearer tokens. Confirmed email, an application account mapping and an active managed session are required. |
| Authorization | The API reloads roles and active seller relationships from PostgreSQL. Registration inputs and editable Auth metadata cannot grant authority. |
| Database runtime | A non-owner `NOBYPASSRLS` login inherits `lumavok_runtime`. Startup rejects elevated privileges, table ownership and role-switching sessions. |
| Row access | RLS predicates, column grants and protected-field triggers restrict public, account, seller and administrative operations. Application tables are not exposed to Data API roles by the security migrations. |
| Privileged SQL | Internal helpers use fixed search paths and restricted execution. Runtime queries are parameterized. |
| Sessions | Browser access tokens remain in memory. Refresh cookies are HttpOnly, Secure in production and SameSite=Strict. Mutation requests validate Origin. |
| Refresh and recovery | Shared refresh rejects stale session responses. Account/role changes clear private caches. Recovery responses avoid account enumeration and tokens are removed from browser URLs. |
| Images | Active sellers upload decoded, validated and re-encoded image bytes. Seller-scoped object paths, UUID asset identifiers and database attachment rules protect ownership and deletion. |
| API responses | Validated inputs, bounded pagination and stable error codes limit malformed requests and disclosure of database/provider details. |
| Web delivery | Same-origin API requests, nonce-based script CSP, security headers and private/no-store responses protect browser delivery. Production requires TLS. |
| Changes and releases | Lockfiles, pinned CI actions, audits, secret scanning and protected release workflows support review and controlled deployment. |

Authorization tests include denied reads and writes across accounts, hidden drafts, protected roles and ownership, translation isolation, location consistency and attached-media deletion. Enabling RLS without appropriate grants and policies is insufficient.

## Operational responsibilities

The API and runtime connection are trusted to establish transaction-local actor context. A compromised API or stolen runtime credential can forge that context. Operators protect credentials, restrict network access and maintain a rotation procedure.

The Storage credential remains privileged even when it has no application-table access. It stays server-side, separate from the runtime database and migration logins. Signed image URLs provide temporary bearer access. Existing public Cloudinary references require a separately reviewed migration before their access model changes.

Rate limits are process-local. Multiple API replicas require shared enforcement or an appropriate trusted edge. Unattached-upload retention, monitoring, alert routing, backup schedules and vulnerability-response ownership also require operational configuration.

## Release requirements

Automated fixtures simulate Auth and Storage transport. They do not certify real confirmation/recovery email, managed revocation, private object access, TLS/proxy cookies or pooler behavior. Operators complete those checks, an actual private backup/restore rehearsal and the reviewed migration workflow before production.

The latest recorded live inspection and repository controls are summarized in [Operations status](docs/OPERATIONS_STATUS.md). [Deployment](docs/DEPLOYMENT.md) contains the release gates. Historical Auth failures are dated observations, not a current health check.

The secret scanner detects known patterns without printing values. It complements review and provider secret scanning; it cannot prove that every secret format or earlier commit is safe.
