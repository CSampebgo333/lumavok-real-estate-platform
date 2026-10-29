# Maintained API contract

The public web origin proxies `/api/v1` to Express. The API is not mounted at a separate browser-accessible origin in the supplied deployment. Every authenticated call uses a bearer access token; refresh uses the HttpOnly cookie. Sensitive cookies are Secure in production and SameSite=Strict. Mutation requests with an unexpected Origin are rejected.

Success: `{ "success": true, "data": ... }`. Errors use HTTP status plus `{ "success": false, "code": "...", "message": "..." }`; validation may include safe field errors. The frontend maps stable codes to English/French messages. Never render raw provider/SQL errors as user-facing text.

Paginated data: `{ "items": [], "total": 0, "page": 1, "pageSize": 12, "totalPages": 1 }`. Page sizes are capped at 100, pages are positive safe integers capped at one million, and repeated/object query values are rejected. Catalogue sort/category/filter names are allowlisted in the API. Exact accepted fields are in the committed router/schema files and HTTP contract tests.

## Routes

| Prefix                         | Endpoints and authority                                                                                                                                                                                   |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/auth`                        | POST `login`, `register`, `refresh`, `logout`, `forgot-password`, `reset-password`. Logout requires a verified current session. Registration returns a session or `202` with `requiresEmailConfirmation`. |
| `/properties`                  | GET catalogue, `/by-id/:id`, `/:slug`, `/:id/related`; public active content only.                                                                                                                        |
| `/developers`                  | GET public seller catalogue, `/:slug`, `/:id/listings`; active public business data only.                                                                                                                 |
| `/locations`, `/features`      | GET canonical references and translated feature labels.                                                                                                                                                   |
| `/favorites`                   | GET own favorites; POST `/:propertyId` toggles the authenticated account’s property favorite.                                                                                                             |
| `/viewings`                    | GET own paginated requests; POST a viewing with `propertyId` and an explicit-offset future `scheduledFor`; owner and buyer derived from the verified context.                                             |
| `/sellers`                     | POST `/request` (USER); GET `/pending` and POST `/:id/activate` (ADMIN).                                                                                                                                  |
| `/sellers/me`                  | GET own exact-language profile; PATCH active seller's safe profile fields using `expectedUpdatedAt`. Public contact email is explicit and separate from account email.                                    |
| `/developers/me/listings`      | Seller GET list/counts/edit; POST create; PATCH content/status/bulk-status; DELETE controlled listing or POST bulk-delete; POST `/:id/translations/:lang/publish`.                                        |
| `/developers/me/appointments`  | Seller list/counts/details; PATCH status, reschedule and supported bulk transitions.                                                                                                                      |
| `/developers/me/notifications` | Seller GET list/unread-count; PATCH `/:id/read`, `/read-all`. Mark-all returns `{updatedCount}`.                                                                                                          |
| `/developers/me/dashboard`     | Seller bounded aggregate preview.                                                                                                                                                                         |
| `/developers/me/analytics`     | Seller bounded SQL aggregation and trends.                                                                                                                                                                |
| `/uploads`                     | Seller POST `/file` multipart `file`; DELETE `/:publicId` using an encoded public ID. The server validates asset ownership and state.                                                                     |

`GET /api/health` is process liveness; `GET /api/ready` checks a database round trip. Readiness is not a substitute for managed Auth/Storage staging checks.

## Localization

Every content read accepts explicit `?lang=en` or `?lang=fr`. A missing language uses application settings; unsupported/inactive language returns 400. Responses include `requestedLanguage`, `contentLanguage` (nullable for unclassified legacy content) and `fallbackUsed`. Fallback is requested language, configured fallback, then verified source. Unpublished property translations are unavailable publicly. The editor reads an exact language rather than treating fallback as editable translated content.

```bash
curl 'http://localhost:3000/api/v1/properties/house-one?lang=en'
curl 'http://localhost:3000/api/v1/properties/house-one?lang=fr'
```

Illustrative fixture responses for the same property (additional detail fields omitted):

```json
{
  "success": true,
  "data": {
    "id": "p1",
    "slug": "house-one",
    "title": "House in Ouagadougou",
    "description": "Family house with a garden in Ouagadougou.",
    "price": 45000000,
    "priceDecimal": "45000000.00",
    "currencyCode": "XOF",
    "listingType": "SALE",
    "rentPeriod": null,
    "requestedLanguage": "en",
    "contentLanguage": "en",
    "fallbackUsed": false
  }
}
```

```json
{
  "success": true,
  "data": {
    "id": "p1",
    "slug": "house-one",
    "title": "Maison à Ouagadougou",
    "description": "Maison familiale avec jardin à Ouagadougou.",
    "price": 45000000,
    "priceDecimal": "45000000.00",
    "currencyCode": "XOF",
    "listingType": "SALE",
    "rentPeriod": null,
    "requestedLanguage": "fr",
    "contentLanguage": "fr",
    "fallbackUsed": false
  }
}
```

If English is missing and French is the configured fallback, the English request returns the French text with `requestedLanguage: "en"`, `contentLanguage: "fr"`, `fallbackUsed: true`. The monetary facts, IDs and relationships are unchanged. A parameterized SQL example for curated, publicly publishable translations is [localized-property.sql](../database/operations/localized-property.sql); invoke it under the ordinary scoped runtime role, never expose a privileged SQL RPC.

## Write semantics

Listing patches use `contentLanguage`, canonical city/district/feature IDs, `rowVersion` from the current record, `currencyCode` and optional `rentPeriod`. Categories accept the supported frontend/database casing, then normalize. The frontend `DEVELOPER` label maps to database `PROPERTY_DEVELOPER`; role grants remain server-controlled. A stale row version/profile timestamp returns 409 and requires reloading rather than overwriting another edit.

New Burkina listings support XOF. SALE has no rent period; RENT requires an explicit supported period before publication. A draft may be incomplete; publication validates complete text, location, monetary terms, address and images. Legacy unknown metadata requires reviewed curation and is not silently replaced.

New-media DTOs carry a server-issued public ID and preview URL. The server validates/locks the registered available asset before attaching it; client URLs never confer ownership. Attached objects cannot be deleted. Removing an image from an editor does not delete Storage bytes before the listing change commits.

## Error behavior

400 means malformed/invalid input; 401 means absent/invalid/ended identity; 403 means the verified actor lacks authority; 404 means the resource is not visible/found; 409 means conflict/duplicate transition or protected asset use; 413 is oversized content; 429 is rate limiting; 503 is temporary database/provider unavailability. Clients retry only appropriate operations and never replay a mutation as a different account. API and refresh requests have bounded client timeouts; server catalogue/provider requests use timeouts too.

Recovery tokens are submitted in the reset body after fragment capture and immediate URL scrubbing. No token is sent through a query-string validation endpoint. Browser tests use a synthetic provider; actual email link and revocation behavior must be verified in staging.
