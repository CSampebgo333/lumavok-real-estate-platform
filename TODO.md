# Remaining work

This list tracks outstanding release and operational work. Implemented capabilities are described in the [README](README.md); verification procedures and evidence are in [Testing](docs/TESTING.md).

## Before production

- Operators capture a private backup and complete an isolated restore/preservation rehearsal.
- Operators follow recovered exact migration history or reviewed baseline adoption, then obtain explicit approval for the target and pending migrations.
- Operators verify the restricted database login, intended pooler, RLS/grants and production proxy/TLS configuration.
- Operators configure and test real Auth confirmation, recovery, session refresh and revocation.
- Operators provision private Storage and verify upload, display, ownership, expiry and deletion behavior.
- Sellers and administrators review legacy identity mappings, source language, translations, currencies, rental periods and public business contact details.
- Maintainers supply approved terms/privacy content and configure its HTTPS URLs.
- Operators establish monitoring, alert ownership, backup schedules, secret rotation and a tested rollback procedure.
- Maintainers provide a compatible host and isolated services for a shareable full-stack preview.

## Team and scaling

- Maintainers onboard an authorized independent reviewer and review peer-approval/environment settings.
- Operators define retention for unattached uploads using the existing asset lifecycle.
- Shared rate-limit enforcement is required before relying on global limits across multiple API replicas.
- Production-scale query plans and load tests inform further performance work.

Map view, direct WhatsApp contact, dashboard settings and administrative reporting remain disabled features. Their presence in older planning notes is not an implementation commitment. [Frontend follow-up](frontend/TODO.md) and [Deployment](docs/DEPLOYMENT.md) provide the relevant scope.
