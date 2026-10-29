# Lumavok — Deployment Handoff

**To:** Emmanuel Adoum, Chief Technology Officer  
**From:** Clément Sampebgo  
**Date:** 29 October 2026  
**Subject:** Remaining work before production deployment

Hi Emmanuel,

All repository improvements have been merged into `main`, including the integration fixes, database restructuring and documentation cleanup. All six required CI jobs passed for the reviewed changes.

The next step is to prepare the actual service environment and take the platform through deployment. Production deployment has not been performed, and the live Supabase database has not yet received the integration migrations, according to the latest recorded inspection.

Please coordinate the remaining work in the following order.

## 1. Prepare hosting and a working preview

Select a host compatible with the Next.js frontend and Express/Prisma API. Configure the domain, HTTPS, private API connectivity and secure environment variables.

Provide a working preview using isolated demonstration services and safe data so the team can review the complete application before launch. Private records must remain outside that preview.

## 2. Back up the existing database and rehearse recovery

Create a private backup and successfully restore it into an isolated environment. Verify application records, migration history, Auth data and Storage objects. A schema snapshot alone is not a complete backup.

Two original August migration files remain unavailable. Either recover their exact originals or follow the documented baseline-adoption procedure. Preserve existing history and records throughout; do not reconstruct the missing SQL or reset the database.

Supabase must remain on the Free plan. An isolated local environment can support the recovery rehearsal without upgrading, deleting, pausing or repurposing existing projects.

## 3. Prepare database access and migrations

Provision a restricted API database login inheriting only `lumavok_runtime`, with migration credentials kept separate from the running application.

Test the pending migrations on the isolated recovery environment first. Verify data preservation, constraints, effective grants, RLS policies and denied access across accounts. The recorded live database still has incomplete access-policy coverage.

Obtain explicit approval for the target and pending changes before applying migrations or disruptive policy changes to production.

## 4. Configure real authentication and private storage

Configure and test confirmation emails, SMTP, approved redirects, password recovery, session refresh and logout/revocation. Existing accounts require verified Auth identity mapping; matching an email alone is insufficient proof of ownership.

Provision the private `property-media` bucket and test uploads, image display, ownership checks, signed-link expiry and deletion.

Automated tests simulate Auth and Storage responses, so acceptance checks against the actual services remain necessary.

## 5. Review content and legal requirements

Confirm English/French content, translation fallback, currencies, rental periods and seller contact details. Preserve original property facts and Burkina Faso seeds; unresolved business information requires review rather than assumptions.

Supply approved terms and privacy policies and configure their HTTPS links.

## 6. Validate and deploy

Run the main user journeys on the intended host, including browsing, language switching, account recovery, favorites, viewing requests, seller approval, listing publication and image handling.

Confirm monitoring, backups, alert ownership, secret handling and rollback. Select an exact commit with all required checks passing, then deploy through the existing gated workflows using approved immutable image digests. Database migration remains a separate operation.

## Evidence required before production approval

Please share:

- The tested release commit and its successful CI run.
- The working preview URL and acceptance-test results.
- Backup, restore and data-preservation evidence, kept private where appropriate.
- The migration/adoption plan, rehearsal results and required approvals.
- Remaining limitations and any unresolved release blockers.
- The rollback procedure and responsible operators.

## Reference documents

- [Documentation index](docs/README.md)
- [Deployment procedure](docs/DEPLOYMENT.md)
- [Baseline adoption and recovery](docs/BASELINE_AND_FREE_RESTORE.md)
- [Operations status](docs/OPERATIONS_STATUS.md)
- [Testing and verification](docs/TESTING.md)
- [Remaining work](TODO.md)

Please flag any access, hosting, budget or business decision that needs team approval before proceeding.

Clément
