# Contributing

Contributors keep changes focused, preserve existing data and document behavior that teammates need to understand. Each change starts from the current `main` branch and reaches it through a reviewed pull request.

## Development workflow

1. Contributors use Node 24 and npm 11, then run `npm run setup` from the repository root.
2. A dedicated branch contains the implementation and any related documentation changes.
3. Contributors run the relevant checks and describe the resulting behavior, compatibility impact and actual verification in the pull request.
4. Required CI jobs and review gates pass before merge. Publishing source does not authorize a production deployment.

The standard checks are `npm run check`, `npm test`, `npm run build`, `npm run audit` and the relevant browser suites. Failed checks and unavailable prerequisites remain visible in the pull request; a skipped or unrun check is never reported as passed.

## Database and service changes

The canonical schema is `database/schema.prisma`. SQL migrations also define RLS, grants, constraints, triggers and partial indexes. Contributors add reviewed migrations rather than changing applied files, resetting shared history or using `prisma db push` on shared data.

Original Burkina Faso seeds remain byte-for-byte unchanged. New scenarios use separate disposable fixtures. Database tests cover fresh and observed schemas, legitimate access, denied cross-account operations and preservation. [Baseline adoption](docs/BASELINE_AND_FREE_RESTORE.md) defines the existing-database workflow.

Ownership, roles, visibility, currency, rental periods and media access are security or business boundaries. Changes to those boundaries require explicit requirements and meaningful authorization tests. Client navigation guards never replace server and database checks.

## French and English

Contributors update both interface dictionaries with matching keys and interpolation placeholders. Database translations use exact-language rows; fallback content is not saved as a newly authored translation. Identifiers, internal state values and numeric facts stay language-independent. Tests cover behavior in both languages, including missing translations and failure states.

## Secrets and private information

Credentials, environment files, private backups and reviewed production manifests stay outside Git. Contributors run `npm run scan:secrets` before publication and avoid logging tokens, passwords or raw provider errors. Test credentials are clearly identified and work only with disposable fixtures.

## Documentation style

Project documentation uses clear subjects and consistent terms: users browse properties, sellers manage listings, administrators review applications, contributors maintain code, and operators manage services. The API path and database model named `developer` remain unchanged identifiers; explanatory prose calls that business role a seller.

Descriptions use plain, professional language. Procedures state the action and its purpose without conversational handoff notes, personal diary language or unsupported readiness claims. Commands, identifiers, attributed material, licenses and dated historical results retain their meaning. New verification claims name the tested revision or CI run.

The [documentation index](docs/README.md) separates maintained instructions from historical evidence. Contributors update the relevant guide rather than repeating operational instructions across several files.
