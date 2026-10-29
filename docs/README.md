# Documentation

The maintained guides describe the integrated Lumavok application. Dated records describe the revision and environment inspected at the time; they do not override current instructions or establish production readiness.

## Getting started

| Guide | Purpose |
| --- | --- |
| [Project overview](../README.md) | Capabilities, repository structure, installation and local execution |
| [Contributing](../CONTRIBUTING.md) | Development workflow, preservation rules and documentation style |
| [Web interface](../frontend/README.md) | Frontend commands, language behavior and account state |
| [API](../backend/README.md) | API commands and runtime responsibilities |
| [Database](../database/README.md) | Schema, migrations, operations and test entry points |

## Design and operations

| Guide | Purpose |
| --- | --- |
| [Architecture](ARCHITECTURE.md) | Component boundaries, localization, media and authorization |
| [API contracts](API_CONTRACT.md) | Routes, payloads, languages, write semantics and error codes |
| [Schema](SCHEMA.md) | Entities, integrity rules, indexes and access matrix |
| [Security](../SECURITY.md) | Enforced boundaries and operational responsibilities |
| [Testing](TESTING.md) | Reproducible checks, fixture limits and per-revision evidence |
| [Deployment](DEPLOYMENT.md) | Environments, migration selection, releases and rollback |
| [Baseline adoption and restore](BASELINE_AND_FREE_RESTORE.md) | Existing database adoption without fabricated history or a paid project |
| [Operations status](OPERATIONS_STATUS.md) | Last recorded service state, repository controls and unresolved gates |
| [Integration](INTEGRATION.md) | Supported end-to-end flows and compatibility conventions |
| [Remaining work](../TODO.md) | Active release and operational backlog |

## History and provenance

[Audit](AUDIT.md), [application review](INDEPENDENT_REVIEW.md), [initial database review](database-review/README.md) and [source provenance](consolidation/ORIGINS.md) retain the context of earlier decisions. The machine-readable branch inventory preserves historical paths.

[Historical records](archive/README.md) contain the original frontend plan/changelog, earlier testing notes and operations record. [Database design references](../database/docs/COMPLETE_DATABASE_DESIGN_README.md) describe the earlier schema; `database/schema.prisma` and ordered migrations define the maintained implementation.

The integration-roadmap and product-reconciliation files are retained navigation points to the current guides. Contributors update the canonical guide for a topic rather than creating another overlapping handoff document.
