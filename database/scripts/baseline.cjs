const { Client } = require("pg");
const { ReviewError } = require("./migration-audit.cjs");
const {
  endpoint,
  capture,
  compare,
  readApprovedBaseline,
  writePrivateBaseline,
} = require("./application-baseline.cjs");

async function main() {
  const [command, flag, output, ...extra] = process.argv.slice(2);
  if (
    extra.length ||
    !(
      (command === "capture" && flag === "--output" && output) ||
      (command === "compare" && !flag)
    )
  )
    throw new ReviewError(
      "Use baseline:capture -- --output /private/baseline.json or baseline:compare.",
    );
  const approved = command === "compare" ? readApprovedBaseline() : null;
  endpoint(process.env.DIRECT_URL);
  const client = new Client({
    connectionString: process.env.DIRECT_URL,
    connectionTimeoutMillis: 15000,
  });
  try {
    await client.connect();
    const actual = await capture(client, process.env.DIRECT_URL);
    if (approved) {
      compare(approved, actual, false);
      console.log(
        "Application schema, audited history and runtime-role metadata match. Row data, Auth/Storage configuration and file bytes are NOT verified by this comparison.",
      );
    } else {
      const hash = writePrivateBaseline(output, actual);
      console.log(`Private application baseline saved. SHA-256: ${hash}`);
      console.log(
        "Read-only capture only; this is not a data backup, restore test or deployment approval. Review it before setting LUMAVOK_BASELINE_SHA256.",
      );
    }
  } finally {
    await client.end();
  }
}
main().catch((error) => {
  console.error(
    error instanceof ReviewError
      ? error.message
      : "Baseline operation failed. Check the private file path, PostgreSQL client and secure connection; sensitive error details were not printed.",
  );
  process.exitCode = 1;
});
