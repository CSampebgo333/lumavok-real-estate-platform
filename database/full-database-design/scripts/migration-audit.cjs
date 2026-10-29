const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const root = path.resolve(__dirname, "..");
const historical = Object.freeze({
  "20260629000000_init":
    "6463d2eaa9074e955a7af437959f164a8f77c968d54c0459339fd3e97acb580a",
  "20260831000001_expand_enums":
    "d65a7b8abef1ec0a04c18da2dccaabd8e1c0d9b9f8d29a3e21c28d20f64c89e5",
  "20260831000002_add_tables_and_columns":
    "768cd85a9e674e8f2dd50568b26e8433e64e2eacb8320e46335422d913eee2a5",
});
const unavailable = new Set(Object.keys(historical).slice(1));
class ReviewError extends Error {}
const sha256 = (value) =>
  crypto.createHash("sha256").update(value).digest("hex");

function localMigrations() {
  const files = new Map();
  for (const name of fs.readdirSync(path.join(root, "migrations")).sort()) {
    if (!/^\d{14}_[a-z0-9_]+$/.test(name)) continue;
    files.set(
      name,
      sha256(
        fs.readFileSync(path.join(root, "migrations", name, "migration.sql")),
      ),
    );
  }
  return files;
}

function requireOriginalFiles(files = localMigrations()) {
  for (const [name, checksum] of Object.entries(historical)) {
    if (!files.has(name))
      throw new ReviewError(
        `Missing audited migration: ${name}. Recover the original file OR use the reviewed baseline adoption workflow in docs/BASELINE_AND_FREE_RESTORE.md. Do not invent historical SQL.`,
      );
    if (files.get(name) !== checksum)
      throw new ReviewError(`Migration checksum mismatch: ${name}`);
  }
}

function validateHistory(rows, files = localMigrations(), adopt = false) {
  const applied = new Map();
  for (const row of rows) {
    if (
      !/^\d{14}_[a-z0-9_]+$/.test(row.migration_name) ||
      !/^[a-f0-9]{64}$/.test(row.checksum)
    )
      throw new ReviewError("Invalid migration history entry.");
    if (!row.applied && !row.rolled_back)
      throw new ReviewError(
        "An unresolved failed migration requires operator review.",
      );
    if (row.rolled_back) continue;
    if (applied.has(row.migration_name))
      throw new ReviewError(
        "Duplicate applied migration history requires operator review.",
      );
    applied.set(row.migration_name, row.checksum);
    const expected = files.get(row.migration_name);
    if (
      expected !== row.checksum &&
      !(
        adopt &&
        !expected &&
        unavailable.has(row.migration_name) &&
        historical[row.migration_name] === row.checksum
      )
    )
      throw new ReviewError(
        `Unknown or changed applied migration: ${row.migration_name}`,
      );
  }
  for (const [name, checksum] of Object.entries(historical)) {
    if (applied.get(name) !== checksum)
      throw new ReviewError(`Audited applied history does not match: ${name}`);
    if (files.has(name) && files.get(name) !== checksum)
      throw new ReviewError(`Migration checksum mismatch: ${name}`);
  }
  // Never permit an old pending migration to run after a newer applied one.
  let pending = false;
  for (const name of files.keys()) {
    if (!applied.has(name)) pending = true;
    else if (pending)
      throw new ReviewError(
        "Applied migrations are not a continuous local prefix.",
      );
  }
  return [...files]
    .filter(([name]) => !applied.has(name))
    .map(([name]) => name);
}

module.exports = {
  root,
  historical,
  sha256,
  ReviewError,
  localMigrations,
  requireOriginalFiles,
  validateHistory,
};
