# Remaining release gates

Source implementation and known limitations are maintained in [docs/TESTING.md](docs/TESTING.md), [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) and [SECURITY.md](SECURITY.md). Avoid treating superseded frontend-only planning notes as active product requirements.

- Recover the two exact original applied August migration files for the existing production project.
- Complete the isolated managed-Supabase migration/backup-restore and Auth/Storage/TLS/pooler rehearsal.
- Review legacy identity links and content-language/currency/rental metadata through private manifests; preserve original facts.
- Supply approved published terms/privacy content and the HTTPS policy links used by registration.
- Configure protected branches, protected release/staging/production environments, secure secrets, monitoring ownership and approved deployment infrastructure.
- Define reviewed unattached-upload retention and multi-replica rate limiting before scaling beyond the documented topology.

No production deployment is authorized by completing this checklist in source. Obtain the explicit operational approval described in the deployment guide.
