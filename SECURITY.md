# Security model and review

Report suspected vulnerabilities privately to the repository owners through an established private channel. Do not post credentials, production records or exploit details in a public issue. No private-reporting address or operational response guarantee has been invented.

## Implemented controls

| Boundary         | Enforcement                                                                                                                                                                                                             |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Identity         | Supabase verifies the bearer token; confirmed email and a mapped Auth UUID are required. Sensitive requests also check the session identifier against managed session state.                                            |
| Authority        | Reload application roles and active, non-deleted seller membership from PostgreSQL. Registration cannot grant a role; editable Auth metadata is not trusted. Seller activation is administrator-only and atomic.        |
| Runtime database | Non-owner `NOBYPASSRLS` login inheriting `lumavok_runtime`; startup rejects elevated roles, owner memberships and `SET ROLE` sessions. Migration URL is kept outside the service.                                       |
| RLS and grants   | Tables use appropriate public/owner/client/admin predicates plus column grants and protected-field triggers. Data API roles do not receive application-table access; `service_role` application privileges are revoked. |
| Privileged SQL   | Fixed search paths, parameterized queries, protected internal functions, and no public execute permission on privileged trigger helpers. Views are not used to bypass RLS.                                              |
| Sessions         | In-memory browser access token; HttpOnly, Secure-in-production, SameSite=Strict refresh cookie. Origin validation for mutations. Shared refresh rejects stale responses; cache clears on account/authority change.      |
| Logout/recovery  | Server revokes sessions; unsuccessful revocation is surfaced. Recovery tokens use the fragment/body flow and are scrubbed from the URL. Recovery responses do not disclose account existence.                           |
| Uploads          | Authenticated active seller, per-seller quota, file/dimension limits, real image decoding/re-encoding, private bucket, verified UUID path, short signed URLs, asset-state FK and idempotent deletion.                   |
| Input/output     | Validated DTOs and canonical IDs, bounded pagination, stable error codes, safe generic provider/DB errors, no token/secret logs.                                                                                        |
| Web delivery     | Same-origin API proxy, nonce script CSP, frame/object restrictions, security headers, explicit private/no-store responses, TLS server example.                                                                          |
| Delivery         | Lockfiles, pinned CI actions, dependency audits, publication scan, least-permission jobs and explicit environment-gated deployment.                                                                                     |

The RLS tests check allowed operations **and denied reads/writes across accounts**, protected role/owner/activation fields, public draft hiding, cross-city districts, ownerless/orphan data, translation isolation and attached-media deletion. RLS being enabled by itself is not considered adequate verification.

## Residual risks and operational requirements

- The API and ordinary runtime connection are trusted to establish actor variables. A compromised backend or stolen runtime credential can impersonate actors within that boundary. Protect secrets, restrict network access and rotate credentials; RLS does not eliminate this trust.
- The Storage credential can administer Storage objects and therefore remains privileged even though application-table access is revoked. Keep it server-only and separate from the migration and database logins. Verify the actual Supabase key/grant behavior in staging.
- Signed media URLs grant temporary bearer access. Existing public Cloudinary URLs cannot be made private retroactively without a separately approved migration. Private-backup-derived URL verification was not performed because automatic approval review blocked disclosure to third parties.
- Rate limits are process-local. Multiple API replicas need a shared rate-limit store or trusted edge enforcement before relying on global quotas. There is no implemented payment or fraud-detection service.
- Search uses bounded queries and indexes but has not been load-tested with production-scale data. Counters and historical event text are retained; analytics ingestion is not an abuse-proof public tracking pipeline.
- Unattached upload retention/cleanup, backup schedules, alert routing, GitHub branch/environment protection, vulnerability-response ownership and secret rotation are operational tasks, not settings created by source files.
- Browser/HTTP tests simulate Auth and Storage transport. Real email confirmation/recovery, cookie behavior behind production TLS/proxies, session revocation, managed Auth health, Storage access and pooler behavior require staging checks.
- No production changes were made. The initially inspected managed Auth endpoint returned 5xx, and two historical migration files are unavailable. Both are explicit existing-project release blockers.

The pattern-based secret scanner checks publication candidates without printing values. It cannot detect every secret format or prove that earlier repository history is safe. It complements review and GitHub secret scanning; it is not a credential vault.
