// Real pg_dump/psql/Prisma rehearsal, restricted to newly created loopback fixture databases.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { Client } = require("pg");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const crypto = require("node:crypto");
const { spawnSync } = require("node:child_process");
const { historical, root } = require("../scripts/migration-audit.cjs");
const {
  pgEnvironment,
  capture,
  compare,
  writePrivateBaseline,
} = require("../scripts/application-baseline.cjs");

test(
  "PostgreSQL 17: restore fixture and deploy with verified adoption, preserving unavailable history and legacy data",
  { timeout: 180000 },
  async () => {
    if (
      process.env.NODE_ENV !== "test" ||
      process.env.LUMAVOK_ALLOW_DISPOSABLE_DATABASE !== "1"
    )
      throw new Error("Explicit disposable test environment required.");
    const base = new URL(process.env.LUMAVOK_NATIVE_TEST_URL);
    if (!["localhost", "127.0.0.1", "[::1]"].includes(base.hostname))
      throw new Error("Native rehearsal accepts loopback only.");
    const admin = new Client({ connectionString: base.toString() });
    const suffix = crypto.randomBytes(8).toString("hex");
    const names = [
      "lumavok_baseline_source_" + suffix,
      "lumavok_baseline_restore_" + suffix,
    ];
    const directory = fs.mkdtempSync(
      path.join(os.tmpdir(), "lumavok-adoption-native-"),
    );
    const clients = [];
    const created = [];
    await admin.connect();
    try {
      for (const name of names) {
        await admin.query(`CREATE DATABASE "${name}"`);
        created.push(name);
      }
      const urls = names.map((name) => {
        const url = new URL(base);
        url.pathname = "/" + name;
        return url.toString();
      });
      for (const url of urls) {
        const client = new Client({ connectionString: url });
        await client.connect();
        clients.push(client);
      }
      const [source, restored] = clients;
      for (const role of [
        "anon",
        "authenticated",
        "service_role",
        "supabase_admin",
      ])
        await source.query(
          `DO $$ BEGIN IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='${role}') THEN CREATE ROLE ${role}; END IF; END $$;`,
        );
      await source.query(
        "CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY); CREATE TABLE auth.sessions(id uuid PRIMARY KEY,user_id uuid REFERENCES auth.users(id));",
      );
      await source.query(
        fs.readFileSync(
          path.join(root, "tests/fixtures/observed-schema.sql"),
          "utf8",
        ),
      );
      for (const [name, checksum] of Object.entries(historical))
        await source.query(
          "INSERT INTO public._prisma_migrations(id,checksum,migration_name,started_at,finished_at,applied_steps_count) VALUES($1,$2,$3,now(),now(),1)",
          [crypto.randomUUID(), checksum, name],
        );
      await source.query(
        "INSERT INTO public._prisma_migrations(id,checksum,migration_name,started_at,rolled_back_at,logs) VALUES($1,$2,'20260831000000_add_appointments_admin_notifications',now(),now(),'synthetic rollback evidence')",
        [crypto.randomUUID(), "a".repeat(64)],
      );
      await source.query(`INSERT INTO public."user"(id,email,password_hash,role) VALUES('fixture-owner','fixture@example.test','unusable-fixture','PROPERTY_DEVELOPER');
      INSERT INTO public.city(id,name)VALUES('fixture-city','Ouagadougou');
      INSERT INTO public.district(id,city_id,name)VALUES('fixture-district','fixture-city','Zone du Bois');
      INSERT INTO public.property_developer(id,user_id,whatsapp_number,phone_number,profile_image_url,profile_image_public_id,city,updated_at)VALUES('fixture-developer','fixture-owner','','','','','Ouagadougou',now());
      INSERT INTO public.property(id,property_developer_id,title,slug,description,category,listing_type,price,address,city_id,district_id,updated_at)VALUES('fixture-property','fixture-developer','Maison à Ouagadougou','fixture-property','Description française conservée','HOUSE','RENT',125000,'Fixture address','fixture-city','fixture-district',now());`);
      const beforeHistory = (
        await source.query(
          "SELECT * FROM public._prisma_migrations ORDER BY id",
        )
      ).rows;
      const legacyQuery =
        "SELECT id,title,description,price,listing_type,city_id,district_id FROM public.property ORDER BY id";
      const beforeData = (await source.query(legacyQuery)).rows;
      const sourceBaseline = await capture(source, urls[0]);

      const dump = spawnSync(
        process.env.LUMAVOK_PG_DUMP || "pg_dump",
        ["--no-password", "--format=plain"],
        {
          env: pgEnvironment(urls[0]),
          encoding: "utf8",
          timeout: 30000,
          maxBuffer: 8 * 1024 * 1024,
        },
      );
      assert.equal(dump.status, 0, "Fixture backup must succeed");
      const restore = spawnSync(
        process.env.LUMAVOK_PSQL || "psql",
        [
          "--no-psqlrc",
          "--no-password",
          "--single-transaction",
          "--set",
          "ON_ERROR_STOP=1",
        ],
        {
          env: pgEnvironment(urls[1]),
          input: dump.stdout,
          encoding: "utf8",
          timeout: 30000,
          maxBuffer: 8 * 1024 * 1024,
        },
      );
      assert.equal(restore.status, 0, "Fixture restore must succeed");
      const restoredBaseline = await capture(restored, urls[1]);
      compare(sourceBaseline, restoredBaseline, false);
      assert.deepEqual((await restored.query(legacyQuery)).rows, beforeData);
      assert.deepEqual(
        (
          await restored.query(
            "SELECT * FROM public._prisma_migrations ORDER BY id",
          )
        ).rows,
        beforeHistory,
      );

      const file = path.join(directory, "restored.baseline.json");
      const hash = writePrivateBaseline(file, restoredBaseline);
      const env = {
        ...process.env,
        DIRECT_URL: urls[1],
        DATABASE_URL: urls[1],
        LUMAVOK_BASELINE_FILE: file,
        LUMAVOK_BASELINE_SHA256: hash,
        LUMAVOK_DATABASE_APPROVAL: "disposable-fixture-only",
        LUMAVOK_BASELINE_APPROVAL: "disposable-fixture-only",
        LUMAVOK_BACKUP_REFERENCE: "synthetic-pg-dump",
        LUMAVOK_RESTORE_TEST_REFERENCE: "synthetic-local-restore",
        LUMAVOK_TARGET_PROJECT: names[1],
      };
      const run = (apply = false) =>
        spawnSync(
          process.execPath,
          [
            path.join(root, "scripts/deploy-reviewed.cjs"),
            ...(apply ? ["--apply"] : []),
          ],
          { env, encoding: "utf8", timeout: 60000 },
        );
      const preflight = run();
      assert.equal(preflight.status, 0, preflight.stderr);
      await restored.query(
        "CREATE INDEX fixture_drift ON public.property(title)",
      );
      const drift = run();
      assert.equal(drift.status, 1);
      assert.match(drift.stderr, /drift/);
      await restored.query("DROP INDEX fixture_drift"); // This object was created by this disposable test.
      await restored.query(
        "CREATE POLICY fixture_policy_drift ON public.property FOR SELECT USING(false)",
      );
      const policyDrift = run();
      assert.equal(policyDrift.status, 1);
      assert.match(policyDrift.stderr, /drift/);
      await restored.query(
        "DROP POLICY fixture_policy_drift ON public.property",
      );
      const deployment = run(true);
      assert.equal(deployment.status, 0, deployment.stderr);
      assert.deepEqual((await restored.query(legacyQuery)).rows, beforeData);
      assert.deepEqual(
        (
          await restored.query(
            "SELECT * FROM public._prisma_migrations WHERE id=ANY($1) ORDER BY id",
            [beforeHistory.map((row) => row.id)],
          )
        ).rows,
        beforeHistory,
      );
      assert.equal(
        (
          await restored.query(
            "SELECT count(*)::int AS n FROM public._prisma_migrations WHERE migration_name LIKE '202610%' AND finished_at IS NOT NULL",
          )
        ).rows[0].n,
        4,
      );
      assert.ok(
        (
          await restored.query(
            "SELECT to_regclass('public.property_translation') AS translated",
          )
        ).rows[0].translated,
      );
      const stale = run();
      assert.equal(stale.status, 1);
      assert.match(stale.stderr, /drift/);
      // An explicitly reviewed post-change checkpoint supports an idempotent next preflight.
      const after = await capture(restored, urls[1]);
      env.LUMAVOK_BASELINE_FILE = path.join(directory, "after.baseline.json");
      env.LUMAVOK_BASELINE_SHA256 = writePrivateBaseline(
        env.LUMAVOK_BASELINE_FILE,
        after,
      );
      const noOp = run(true);
      assert.equal(noOp.status, 0, noOp.stderr);
      assert.match(noOp.stdout, /No pending migrations/);
    } finally {
      for (const client of clients) await client.end();
      for (const name of created)
        await admin.query(`DROP DATABASE "${name}" WITH(FORCE)`);
      await admin.end();
      fs.rmSync(directory, { recursive: true, force: true });
    }
  },
);
