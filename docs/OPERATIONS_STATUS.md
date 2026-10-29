# Operations status

This page summarizes the last recorded repository and service checks from 29 October 2026. It is not a live status dashboard. Detailed earlier observations remain in [Operations history](archive/operations-history.md) and the [application review](INDEPENDENT_REVIEW.md).

## Repository controls

The recorded `main` ruleset requires a pull request, resolved review conversations, an up-to-date branch and all six CI jobs. Deletion and force pushes are blocked, with no bypass actors.

The recorded `release`, `staging` and `production` environments require owner approval on `main`, with administrator bypass disabled. Release and deployment flags were saved as disabled. No deployment secrets or production release were recorded by those checks.

Independent peer review still requires teammate onboarding. The recorded repository had no collaborators with direct write access, and required peer approvals were zero. Owner approval is an operational gate, not independent review. `CODEOWNERS` identifies review responsibility without granting access.

## Database and recovery

The last authorized inspection found the `real-estate` project (`haxzufwizwqfrqzzzmsa`) healthy on PostgreSQL 17. Prisma history contained the June initialization and two successful August migrations, plus rolled-back attempts. The later integration migrations were not applied.

Three tables lacked RLS: `_prisma_migrations`, `appointment` and `appointment_history`. Checked grants denied `anon` SELECT/INSERT and `authenticated` SELECT on those tables. Fourteen other tables had RLS enabled without policies. These findings require the reviewed access design before cutover; they do not justify automatic live-policy changes.

The original August SQL files were not found in the inspected sources. Operators can recover checksum-matching originals or follow [reviewed baseline adoption](BASELINE_AND_FREE_RESTORE.md). Original history stays intact under both routes. A schema checkpoint does not satisfy the actual backup/restore requirement.

## Auth, Storage and hosting

The recorded inspection found no `property-media` bucket or Storage object policies. Operators still provision and test private Storage. Historical Auth 5xx observations require a fresh provider acceptance check; their age prevents treating them as a current outage report.

The managed preview attempt failed because its launcher supplied flags rejected by Next.js. The available Sites Worker runtime cannot host the unchanged Express/Prisma/PostgreSQL stack. No working public preview URL was recorded. A compatible Node/container host with isolated demonstration services remains required.

## Free-plan boundary

Supabase remains on the Free plan. The earlier hosted-project quota prevented another free project, but does not prevent local recovery testing. No upgrade, paid resource, project pause, deletion or repurposing is part of the documented workflow. Operators use a private manual export and an isolated local restore where appropriate.

## Next operational steps

Operators complete actual backup restoration, baseline review, restricted runtime credentials, managed Auth/private Storage acceptance, approved legacy identity/content curation, legal-policy URLs, TLS/proxy checks, monitoring and rollback rehearsal. Production migrations and deployment require separate approval. [Deployment](DEPLOYMENT.md) gives the procedure, and [Remaining work](../TODO.md) tracks the open items.
