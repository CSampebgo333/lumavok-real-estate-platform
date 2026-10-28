# Database entry point

The canonical maintained schema is [full-database-design/schema.prisma](full-database-design/schema.prisma), with security/integrity implemented by its versioned SQL migrations. See the current [schema](../docs/SCHEMA.md), [migration strategy](../docs/DEPLOYMENT.md) and [testing guide](../docs/TESTING.md).

Original seed files are unchanged. Use disposable fixtures for integrated development; the guarded legacy seed runner accepts only an explicitly selected local pre-expansion database. No seed, migration or application startup should target production implicitly.
