import { spawnSync } from "node:child_process";
const database = "database";
const plans = {
  install: [
    [database, "ci"],
    ["backend", "ci"],
    ["backend", "run", "db:generate"],
    ["frontend", "ci"],
  ],
  check: [
    [".", "run", "scan:secrets"],
    ["backend", "run", "typecheck"],
    ["frontend", "run", "typecheck"],
    ["frontend", "run", "lint"],
    ["frontend", "run", "format:check"],
  ],
  test: [
    [database, "test"],
    ["backend", "test"],
    ["frontend", "test"],
  ],
  build: [
    ["backend", "run", "build"],
    ["frontend", "run", "build"],
  ],
  audit: [
    [database, "audit", "--audit-level=low"],
    ["backend", "audit", "--audit-level=low"],
    ["frontend", "audit", "--audit-level=low"],
  ],
};
const plan = plans[process.argv[2]];
if (!plan) throw new Error("Unknown workspace command");
for (const [cwd, ...args] of plan) {
  const env = { ...process.env };
  if (args.includes("db:generate")) {
    env.DATABASE_URL ??= "postgresql://local.invalid/lumavok";
    env.DIRECT_URL ??= "postgresql://local.invalid/lumavok";
  }
  const r = spawnSync(process.platform === "win32" ? "npm.cmd" : "npm", args, {
    cwd,
    stdio: "inherit",
    env,
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}
