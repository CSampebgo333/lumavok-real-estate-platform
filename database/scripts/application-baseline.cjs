// Private schema evidence, not a data backup or replacement historical migration.
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const {
  root,
  sha256,
  ReviewError,
  validateHistory,
} = require("./migration-audit.cjs");
const format = "lumavok-application-baseline-v1";
const schemas = ["public", "lumavok_private"];

function endpoint(connectionString) {
  let url;
  try {
    url = new URL(connectionString);
  } catch {
    throw new ReviewError(
      "DIRECT_URL must be a valid PostgreSQL URL supplied securely.",
    );
  }
  if (
    !["postgres:", "postgresql:"].includes(url.protocol) ||
    !url.hostname ||
    !url.pathname.slice(1) ||
    !url.username
  )
    throw new ReviewError(
      "DIRECT_URL must identify a PostgreSQL host, user and database.",
    );
  // These options can redirect libpq away from the endpoint inspected by node-postgres.
  for (const key of url.searchParams.keys())
    if (
      ![
        "sslmode",
        "sslrootcert",
        "sslcert",
        "sslkey",
        "connect_timeout",
        "application_name",
        "schema",
      ].includes(key)
    )
      throw new ReviewError(
        "Unsupported connection option. Use a direct/session PostgreSQL URL without routing overrides.",
      );
  if (
    url.searchParams.has("schema") &&
    url.searchParams.get("schema") !== "public"
  )
    throw new ReviewError("Migration schema must be public.");
  if (
    !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) &&
    !["require", "verify-ca", "verify-full"].includes(
      url.searchParams.get("sslmode"),
    )
  )
    throw new ReviewError(
      "Remote administrative connections must explicitly require TLS (sslmode=require or stronger).",
    );
  return {
    host: url.hostname,
    port: url.port || "5432",
    database: decodeURIComponent(url.pathname.slice(1)),
    user: decodeURIComponent(url.username),
  };
}

function pgEnvironment(connectionString, inherited = process.env) {
  const target = endpoint(connectionString);
  const url = new URL(connectionString);
  // PGDATABASE is a database name, not an implicitly expanded connection URI.
  // Clear inherited routing/SSL overrides; never place credentials in argv.
  const env = Object.fromEntries(
    Object.entries(inherited).filter(
      ([key]) =>
        !key.startsWith("PG") && !["DIRECT_URL", "DATABASE_URL"].includes(key),
    ),
  );
  Object.assign(env, {
    PGHOST: target.host.replace(/^\[|\]$/g, ""),
    PGPORT: target.port,
    PGDATABASE: target.database,
    PGUSER: target.user,
    PGCONNECT_TIMEOUT: "15",
  });
  if (url.password) env.PGPASSWORD = decodeURIComponent(url.password);
  else if (inherited.PGPASSWORD) env.PGPASSWORD = inherited.PGPASSWORD;
  if (inherited.PGPASSFILE) env.PGPASSFILE = inherited.PGPASSFILE;
  const options = {
    sslmode: "PGSSLMODE",
    sslrootcert: "PGSSLROOTCERT",
    sslcert: "PGSSLCERT",
    sslkey: "PGSSLKEY",
    application_name: "PGAPPNAME",
  };
  for (const [option, name] of Object.entries(options))
    if (url.searchParams.has(option)) env[name] = url.searchParams.get(option);
  return env;
}

function canonicalSchema(sql) {
  const start = sql.indexOf("SET statement_timeout = 0;");
  if (start < 0 || !sql.slice(0, start).includes("-- PostgreSQL database dump"))
    throw new ReviewError("Unrecognized pg_dump schema output.");
  const header = sql.slice(0, start);
  const tokens = [...header.matchAll(/^\\restrict ([A-Za-z0-9]+)$/gm)];
  if (tokens.length > 1)
    throw new ReviewError("Unexpected pg_dump restriction header.");
  // Remove only the tool header and the matching outer psql guard, never function bodies.
  if (
    header
      .split("\n")
      .some(
        (line) =>
          line &&
          line !== "--" &&
          !line.startsWith("-- PostgreSQL database dump") &&
          !line.startsWith("-- Dumped from database version ") &&
          !line.startsWith("-- Dumped by pg_dump version ") &&
          !/^\\restrict [A-Za-z0-9]+$/.test(line),
      )
  )
    throw new ReviewError(
      "Unexpected pg_dump header; review the client version.",
    );
  let body = sql.slice(start).trimEnd();
  if (tokens.length) {
    const ending = `\\unrestrict ${tokens[0][1]}`;
    if (!body.endsWith(ending))
      throw new ReviewError("pg_dump restriction trailer does not match.");
    body = body.slice(0, -ending.length).trimEnd();
  }
  if (!body.endsWith("-- PostgreSQL database dump complete\n--"))
    throw new ReviewError("Incomplete pg_dump output.");
  return body + "\n";
}

function dumpSchema(connectionString, snapshot) {
  const result = spawnSync(
    process.env.LUMAVOK_PG_DUMP || "pg_dump",
    [
      "--no-password",
      "--schema-only",
      "--no-comments",
      ...schemas.map((schema) => `--schema=${schema}`),
      "--exclude-table=public._prisma_migrations",
      `--snapshot=${snapshot}`,
    ],
    {
      env: pgEnvironment(connectionString),
      encoding: "utf8",
      timeout: 120000,
      maxBuffer: 16 * 1024 * 1024,
    },
  );
  // Never echo pg_dump stderr: errors can include connection details or SQL literals.
  if (result.error || result.status !== 0 || result.stderr.trim())
    throw new ReviewError(
      "Schema capture failed or pg_dump issued a warning. Check the PostgreSQL client version, permissions and secure connection.",
    );
  return canonicalSchema(result.stdout);
}

async function capture(client, connectionString, dump = dumpSchema) {
  const target = endpoint(connectionString);
  await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
  try {
    await client.query("SET LOCAL search_path=pg_catalog");
    const version = Number(
      (await client.query("SHOW server_version_num")).rows[0]
        .server_version_num,
    );
    if (version < 170000 || version >= 180000)
      throw new ReviewError(
        "This reviewed baseline workflow requires PostgreSQL 17 and a compatible pg_dump client.",
      );
    const { rows: history } =
      await client.query(`SELECT migration_name, checksum,
      finished_at IS NOT NULL AS applied, rolled_back_at IS NOT NULL AS rolled_back,
      applied_steps_count FROM public._prisma_migrations ORDER BY migration_name, checksum, id`);
    validateHistory(history, undefined, true);
    const { rows: roles } =
      await client.query(`SELECT rolname, rolsuper, rolinherit, rolcreaterole, rolcreatedb,
      rolcanlogin, rolreplication, rolbypassrls, rolconfig FROM pg_roles WHERE rolname='lumavok_runtime' ORDER BY rolname`);
    const { rows: memberships } =
      await client.query(`SELECT pg_get_userbyid(roleid) AS role_name,
      pg_get_userbyid(member) AS member_name, admin_option, inherit_option, set_option
      FROM pg_auth_members WHERE roleid=(SELECT oid FROM pg_roles WHERE rolname='lumavok_runtime')
      OR member=(SELECT oid FROM pg_roles WHERE rolname='lumavok_runtime') ORDER BY role_name, member_name`);
    const snapshot = (
      await client.query("SELECT pg_export_snapshot() AS snapshot")
    ).rows[0].snapshot;
    const schemaSql = await dump(connectionString, snapshot);
    await client.query("COMMIT");
    return {
      format,
      capturedAt: new Date().toISOString(),
      target,
      postgresMajor: 17,
      schemas,
      schemaSql,
      schemaSha256: sha256(schemaSql),
      history,
      roles,
      memberships,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

function validateDocument(value) {
  if (
    value?.format !== format ||
    value.postgresMajor !== 17 ||
    JSON.stringify(value.schemas) !== JSON.stringify(schemas) ||
    typeof value.schemaSql !== "string" ||
    value.schemaSha256 !== sha256(value.schemaSql) ||
    !Array.isArray(value.history) ||
    !Array.isArray(value.roles) ||
    !Array.isArray(value.memberships) ||
    !value.target ||
    Object.keys(value.target).sort().join(",") !== "database,host,port,user" ||
    Object.values(value.target).some((v) => typeof v !== "string" || !v)
  )
    throw new ReviewError("Invalid baseline document.");
  validateHistory(value.history, undefined, true);
  return value;
}

function readApprovedBaseline(env = process.env) {
  if (
    !env.LUMAVOK_BASELINE_FILE ||
    !/^[a-f0-9]{64}$/.test(env.LUMAVOK_BASELINE_SHA256 || "")
  )
    throw new ReviewError(
      "Adoption requires LUMAVOK_BASELINE_FILE and its independently reviewed LUMAVOK_BASELINE_SHA256.",
    );
  if (fs.statSync(env.LUMAVOK_BASELINE_FILE).size > 16 * 1024 * 1024)
    throw new ReviewError("Baseline file exceeds the supported size.");
  const bytes = fs.readFileSync(env.LUMAVOK_BASELINE_FILE);
  if (sha256(bytes) !== env.LUMAVOK_BASELINE_SHA256)
    throw new ReviewError(
      "Baseline file checksum does not match the reviewed artifact.",
    );
  return validateDocument(JSON.parse(bytes));
}

function compare(expected, actual, sameTarget = true) {
  validateDocument(expected);
  validateDocument(actual);
  if (
    sameTarget &&
    JSON.stringify(expected.target) !== JSON.stringify(actual.target)
  )
    throw new ReviewError(
      "Baseline belongs to a different database endpoint. Capture and review a target-specific baseline.",
    );
  for (const field of ["schemaSha256", "history", "roles", "memberships"]) {
    if (JSON.stringify(expected[field]) !== JSON.stringify(actual[field]))
      throw new ReviewError(
        `Baseline drift detected in ${field}. Review the difference; do not overwrite the approval to bypass it.`,
      );
  }
}

function writePrivateBaseline(file, value) {
  validateDocument(value);
  const directory = fs.realpathSync(path.dirname(path.resolve(file)));
  const repository = fs.realpathSync(path.resolve(root, ".."));
  if (directory === repository || directory.startsWith(repository + path.sep))
    throw new ReviewError(
      "Save private baseline artifacts outside the Git repository.",
    );
  const text = JSON.stringify(value, null, 2) + "\n";
  fs.writeFileSync(path.join(directory, path.basename(file)), text, {
    flag: "wx",
    mode: 0o600,
  });
  return sha256(text);
}

module.exports = {
  pgEnvironment,
  endpoint,
  canonicalSchema,
  capture,
  compare,
  readApprovedBaseline,
  writePrivateBaseline,
  validateDocument,
};
