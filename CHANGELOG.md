# Changelog

This file records changes to the integrated Lumavok application. Commit and pull-request links identify the source; test results remain attached to their verified revisions. Earlier frontend-only development notes are preserved in the [historical changelog](docs/archive/frontend-changelog.md).

## Unreleased

### Documentation

- Unified project terminology, component READMEs, contributor guidance and operating procedures.
- Added a documentation index and separated current guidance from historical plans and verification records.
- Replaced stale frontend-only backlog statements with the remaining integrated release work.

## 29 October 2026

### Repository structure

[PR #35](https://github.com/CSampebgo333/lumavok-real-estate-platform/pull/35) moved the database implementation directly into `database/`. Scripts, Prisma output, Docker, CI and documentation follow the flattened layout. Seeds, migration SQL, operation files and lockfile contents were preserved.

### Listing presentation and API responses

[PR #34](https://github.com/CSampebgo333/lumavok-real-estate-platform/pull/34) corrected seller currency/rental-period displays, disclosed unconfirmed monetary terms, kept French selection state language-independent and removed internal database identifiers from conflict responses.

These changes were published through reviewed pull requests. They did not deploy the application or change production data, policies or migration history.
