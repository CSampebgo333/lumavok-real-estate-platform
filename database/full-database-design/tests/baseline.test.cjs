const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const {
  historical,
  localMigrations,
  validateHistory,
  sha256,
  root,
} = require("../scripts/migration-audit.cjs");
const {
  endpoint,
  canonicalSchema,
  compare,
  readApprovedBaseline,
  writePrivateBaseline,
} = require("../scripts/application-baseline.cjs");
const history = () =>
  Object.entries(historical).map(([migration_name, checksum]) => ({
    migration_name,
    checksum,
    applied: true,
    rolled_back: false,
    applied_steps_count: 1,
  }));
const baseline = () => ({
  format: "lumavok-application-baseline-v1",
  capturedAt: "2026-10-29T00:00:00.000Z",
  target: endpoint("postgresql://fixture:example@localhost/fixture"),
  postgresMajor: 17,
  schemas: ["public", "lumavok_private"],
  schemaSql: "fixture schema",
  schemaSha256: sha256("fixture schema"),
  history: history(),
  roles: [],
  memberships: [],
});

test("adoption accepts only the two exact audited missing histories, without inventing files", () => {
  const files = localMigrations();
  assert.equal(validateHistory(history(), files, true).length, 4);
  assert.throws(
    () => validateHistory(history(), files, false),
    /Unknown or changed/,
  );
  for (const name of Object.keys(historical).slice(1))
    assert.equal(files.has(name), false);
  const changed = history();
  changed[1].checksum = "0".repeat(64);
  assert.throws(
    () => validateHistory(changed, files, true),
    /Unknown or changed/,
  );
  const unknown = [
    ...history(),
    { ...history()[0], migration_name: "20260901000000_unknown" },
  ];
  assert.throws(
    () => validateHistory(unknown, files, true),
    /Unknown or changed/,
  );
  assert.throws(
    () => validateHistory(history().slice(1), files, true),
    /Audited applied history/,
  );
  assert.throws(
    () => validateHistory([...history(), history()[0]], files, true),
    /Duplicate/,
  );
  assert.throws(
    () =>
      validateHistory(
        [...history(), { ...history()[0], applied: false }],
        files,
        true,
      ),
    /unresolved failed/,
  );
  assert.equal(
    validateHistory(
      [...history(), { ...history()[0], applied: false, rolled_back: true }],
      files,
      true,
    ).length,
    4,
  );
  const last = [...files].at(-1);
  assert.throws(
    () =>
      validateHistory(
        [
          ...history(),
          {
            migration_name: last[0],
            checksum: last[1],
            applied: true,
            rolled_back: false,
          },
        ],
        files,
        true,
      ),
    /continuous local prefix/,
  );
});

test("baseline comparison detects schema, history, role and target drift", () => {
  const approved = baseline();
  compare(approved, baseline());
  for (const field of ["history", "roles", "memberships"]) {
    const changed = baseline();
    if (field === "history") changed.history[0].applied_steps_count = 2;
    else changed[field].push({ altered: true });
    assert.throws(() => compare(approved, changed), /drift/);
  }
  const schema = baseline();
  schema.schemaSql += "changed";
  schema.schemaSha256 = sha256(schema.schemaSql);
  assert.throws(() => compare(approved, schema), /schemaSha256/);
  const other = baseline();
  other.target.database = "isolated_restore";
  assert.throws(() => compare(approved, other), /different database endpoint/);
  compare(approved, other, false); // Explicit read-only cross-target comparison only.
});

test("pg_dump normalization removes only outer metadata and preserves SQL bodies and privileges", () => {
  const dump = (token, version = "17.11") =>
    `--\n-- PostgreSQL database dump\n--\n\n\\restrict ${token}\n\n-- Dumped from database version ${version}\n-- Dumped by pg_dump version ${version}\n\nSET statement_timeout = 0;\nCREATE FUNCTION public.example() RETURNS text LANGUAGE sql AS $$ SELECT '-- Dumped by pg_dump version literal' $$;\nGRANT SELECT ON public.property TO anon;\n--\n-- PostgreSQL database dump complete\n--\n\n\\unrestrict ${token}\n\n`;
  assert.equal(canonicalSchema(dump("a")), canonicalSchema(dump("b", "17.10")));
  assert.match(
    canonicalSchema(dump("a")),
    /-- Dumped by pg_dump version literal/,
  );
  assert.match(canonicalSchema(dump("a")), /GRANT SELECT/);
  assert.throws(
    () =>
      canonicalSchema(dump("a").replace("\\unrestrict a", "\\unrestrict b")),
    /trailer/,
  );
  assert.throws(
    () => canonicalSchema(dump("a").replace("dump complete", "truncated")),
    /Incomplete/,
  );
  assert.throws(
    () =>
      canonicalSchema(
        dump("a").replace(
          "-- Dumped by pg_dump version 17.11",
          "DROP TABLE public.property;",
        ),
      ),
    /Unexpected pg_dump header/,
  );
});

test("private baseline needs a reviewed checksum, cannot overwrite files or be written into the repository", () => {
  const directory = fs.mkdtempSync(
    path.join(os.tmpdir(), "lumavok-baseline-test-"),
  );
  const file = path.join(directory, "fixture.baseline.json");
  try {
    const hash = writePrivateBaseline(file, baseline());
    assert.equal(fs.statSync(file).mode & 0o777, 0o600);
    assert.throws(() => writePrivateBaseline(file, baseline()), /EEXIST/);
    assert.throws(
      () =>
        writePrivateBaseline(
          path.join(root, "fixture.baseline.json"),
          baseline(),
        ),
      /outside the Git repository/,
    );
    assert.throws(
      () => readApprovedBaseline({ LUMAVOK_BASELINE_FILE: file }),
      /reviewed/,
    );
    assert.throws(
      () =>
        readApprovedBaseline({
          LUMAVOK_BASELINE_FILE: file,
          LUMAVOK_BASELINE_SHA256: "0".repeat(64),
        }),
      /checksum/,
    );
    const env = {
      ...process.env,
      DIRECT_URL: "postgresql://fixture:do-not-print-this@127.0.0.1:1/fixture",
      LUMAVOK_BASELINE_FILE: file,
      LUMAVOK_BASELINE_SHA256: hash,
      LUMAVOK_DATABASE_APPROVAL: "",
      LUMAVOK_BASELINE_APPROVAL: "",
      LUMAVOK_BACKUP_REFERENCE: "",
      LUMAVOK_RESTORE_TEST_REFERENCE: "",
      LUMAVOK_TARGET_PROJECT: "",
    };
    const result = spawnSync(
      process.execPath,
      [path.join(root, "scripts/deploy-reviewed.cjs"), "--apply"],
      { env, encoding: "utf8" },
    );
    assert.equal(result.status, 1);
    assert.match(result.stderr, /explicit database approval/);
    assert.doesNotMatch(
      result.stderr + result.stdout,
      /do-not-print-this|ECONNREFUSED/,
    );
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("baseline endpoint binding omits credentials and rejects routing overrides", () => {
  const bound = endpoint(
    "postgresql://user:sensitive@db.example.test/database?sslmode=require&schema=public",
  );
  assert.equal(JSON.stringify(bound).includes("sensitive"), false);
  assert.throws(
    () => endpoint("postgresql://user:secret@db.example.test/database"),
    /require TLS/,
  );
  assert.throws(
    () =>
      endpoint(
        "postgresql://user:secret@db.example.test/database?sslmode=prefer",
      ),
    /require TLS/,
  );
  assert.throws(
    () =>
      endpoint(
        "postgresql://user:secret@db.example.test/database?host=elsewhere",
      ),
    /routing overrides/,
  );
  assert.throws(
    () =>
      endpoint(
        "postgresql://user:secret@db.example.test/database?schema=other",
      ),
    /schema must be public/,
  );
});
