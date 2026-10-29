# Integrated workflows

The web interface uses the Express API for application behavior. Runtime services do not select mock business data. Separate synthetic fixtures support tests and local demonstrations.

## Supported journeys

| Journey | Behavior |
| --- | --- |
| Property discovery | Bounded SQL search, filters and pagination; canonical locations/features; stable slugs; localized details and seller information |
| French and English | Persistent interface selection, explicit content requests, fallback metadata, translated validation/errors and exact-language editing |
| Accounts | Managed registration, confirmation, sign-in, recovery, refresh and revocation |
| Permissions | User, active-seller and administrator workspaces backed by API/database checks; administrators do not automatically impersonate sellers |
| Seller applications | Users apply, administrators activate approved profiles, and refreshed database authority controls access |
| Seller profiles | Localized biography/specialization, canonical city, explicit public contact email and concurrent-edit detection |
| Listings | Draft autosave, canonical references, explicit monetary terms, row versions, translations and validated publication |
| Images | Decoded/re-encoded uploads, verified ownership, signed display and protected attachment/deletion |
| Favorites | Account-based persistence with optimistic updates, rollback and visible failures |
| Viewings | Buyer requests/history, seller scheduling workflows, transactional history/notifications and bounded analytics |
| Failures | Missing resources return 404; service outages remain visible retryable failures rather than empty results |

## Compatibility conventions

The interface role `DEVELOPER` maps to database `PROPERTY_DEVELOPER`; explanatory prose uses seller. Categories normalize supported casing. Listing responses include canonical IDs, `currencyCode`, `rentPeriod`, `priceDecimal` and localization metadata. Listing edits use `rowVersion`, while profile edits use `expectedUpdatedAt`. Mark-all-read notifications return `{updatedCount}` rather than an unbounded list of IDs.

Browser requests use `/api/v1` on the web origin. The application does not silently switch to direct Supabase table queries or a second password/JWT authority.

## Existing records

Public business email is separate from account email and is entered explicitly by the seller. Existing accounts require reviewed Auth identity mapping; matching an unverified email is insufficient proof of ownership.

Original seeds, prices, descriptions and media references remain preserved. Language classification, translations and monetary metadata are reviewed data operations with private manifests and original-value preconditions. Synthetic fixture values do not replace Burkina Faso seed data.

## Acceptance

[Testing](TESTING.md) records automated evidence and fixture boundaries. [Deployment](DEPLOYMENT.md) covers actual provider behavior, database adoption, recovery and production acceptance. A passing integrated fixture does not establish that the corresponding live services are provisioned.
