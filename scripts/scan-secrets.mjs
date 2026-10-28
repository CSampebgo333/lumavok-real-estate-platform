import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
// Scan publishable working-tree files, including new files. Ignored local
// environment files are intentionally outside this publication boundary.
const files = execFileSync(
  "git",
  ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
  { encoding: "utf8" },
)
  .split("\0")
  .filter(Boolean);
const problems = [];
let scanned = 0;
for (const file of new Set(files)) {
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) continue;
  const name = path.basename(file);
  if (/^\.env(?:\.|$)/.test(name) && !name.endsWith(".example")) {
    problems.push([file, "non-example environment file"]);
    continue;
  }
  if (name === "package-lock.json") continue;
  const raw = fs.readFileSync(file);
  if (raw.includes(0)) continue;
  const text = raw.toString("utf8");
  scanned++;
  if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(text))
    problems.push([file, "private key"]);
  if (
    /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,}|sb_secret_[A-Za-z0-9_-]{20,})\b/.test(
      text,
    )
  )
    problems.push([file, "secret access token"]);
  for (const token of text.match(
    /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,
  ) ?? []) {
    try {
      if (
        JSON.parse(Buffer.from(token.split(".")[1], "base64url")).role ===
        "service_role"
      )
        problems.push([file, "service-role JWT"]);
    } catch {}
  }
}
for (const [file, reason] of problems) console.error(`${file}: ${reason}`);
if (problems.length) process.exit(1);
console.log(
  `Secret scan passed (${scanned} first-party text files; no values printed).`,
);
