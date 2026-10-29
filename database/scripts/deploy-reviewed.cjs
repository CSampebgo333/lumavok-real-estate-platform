// Read-only by default. Known missing history requires explicit, reviewed adoption.
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { Client } = require("pg");
const {
  root,
  ReviewError,
  localMigrations,
  requireOriginalFiles,
  validateHistory,
} = require("./migration-audit.cjs");
const {
  endpoint,
  capture,
  compare,
  readApprovedBaseline,
} = require("./application-baseline.cjs");

async function main() {
  if (process.argv.slice(2).some((arg) => arg !== "--apply"))
    throw new ReviewError(
      "Unknown deployment argument. Use the documented secure environment variables.",
    );
  const files = localMigrations();
  const adopting = Boolean(process.env.LUMAVOK_BASELINE_FILE);
  const approved = adopting ? readApprovedBaseline() : null;
  if (!adopting) requireOriginalFiles(files);
  endpoint(process.env.DIRECT_URL);
  const apply = process.argv.includes("--apply");
  if (
    apply &&
    (!process.env.LUMAVOK_DATABASE_APPROVAL ||
      !process.env.LUMAVOK_RESTORE_TEST_REFERENCE ||
      !process.env.LUMAVOK_BACKUP_REFERENCE ||
      !process.env.LUMAVOK_TARGET_PROJECT ||
      (adopting && !process.env.LUMAVOK_BASELINE_APPROVAL))
  )
    throw new ReviewError(
      "Deployment requires explicit database approval, backup, restore-test and target references; adoption also requires baseline approval.",
    );
  if (process.env.PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK)
    throw new ReviewError("Do not disable Prisma migration locking.");
  const client = new Client({
    connectionString: process.env.DIRECT_URL,
    connectionTimeoutMillis: 15000,
  });
  let pending;
  try {
    await client.connect();
    if (approved) {
      const actual = await capture(client, process.env.DIRECT_URL);
      compare(approved, actual);
      pending = validateHistory(actual.history, files, true);
      console.log(
        "Reviewed application baseline and exact historical checksums verified; original history remains unchanged.",
      );
    } else {
      const { rows } = await client.query(`SELECT migration_name,checksum,
        finished_at IS NOT NULL AS applied,rolled_back_at IS NOT NULL AS rolled_back
        FROM public._prisma_migrations ORDER BY migration_name,checksum,id`);
      pending = validateHistory(rows, files);
      console.log("Historical migration checksums verified.");
    }
  } finally {
    await client.end();
  }
  if (!apply) {
    console.log(
      `Read-only preflight completed; ${pending.length} pending migration(s). Nothing applied.`,
    );
    return;
  }
  if (!pending.length) {
    console.log("No pending migrations. Nothing changed.");
    return;
  }
  const result = spawnSync(
    process.execPath,
    [
      require.resolve("prisma/build/index.js"),
      "migrate",
      "deploy",
      "--schema",
      path.join(root, "schema.prisma"),
    ],
    {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 4 * 1024 * 1024,
      env: { ...process.env, DATABASE_URL: process.env.DIRECT_URL },
    },
  );
  // CLI errors can contain SQL or connection details. Never send them to shared logs.
  if (result.error || result.status !== 0) {
    const code = String(result.stderr || "").match(/\bP\d{4}\b/)?.[0];
    throw new ReviewError(
      `Migration deployment did not complete${code ? ` (${code})` : ""}. Inspect migration status through the secure operator environment; do not retry or reset blindly.`,
    );
  }
  console.log(
    "Pending migrations applied by Prisma. Retain the pre-change baseline and capture a new reviewed checkpoint after validation.",
  );
}
main().catch((error) => {
  console.error(
    error instanceof ReviewError
      ? error.message
      : "Migration preflight failed. Check the private baseline and secure database connection; sensitive error details were not printed.",
  );
  process.exitCode = 1;
});
