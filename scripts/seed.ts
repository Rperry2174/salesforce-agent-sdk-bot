// npm run seed: seed the demo org from a natural-language prompt.
//
// The seeding agent in seeder/ reads the prompt and creates the records through the
// Salesforce MCP (Headless 360 `dispatch`, or the sObject server's create tool).
//   npm run seed                          seed from fixtures/seed-prompt.md
//   npm run seed -- --prompt my-org.md    seed from your own prompt (or set SEED_PROMPT_FILE)
//   npm run seed -- --dry-run             plan only: write tools are switched off, nothing changes
//   npm run seed -- --reset               delete the demo accounts (and their records) first
//
// `npm run seed:fixtures` loads fixtures/seed/*.json exactly, with no model in the loop.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DEMO_SITE, MCP_URL } from "../config/salesforce.js";
import { counts as fixtureCounts } from "../lib/expected.js";
import { seed as fixtures } from "../lib/fixtures.js";
import { ROOT, deleteDemoAccounts, demoAccountIds, demoCounts } from "./mcp.js";

const argv = process.argv.slice(2);
const flag = (name: string) => argv.includes(name);
const option = (name: string) => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
};
const dryRun = flag("--dry-run");
const DEFAULT_PROMPT = join(ROOT, "fixtures", "seed-prompt.md");
const promptFile = resolve(option("--prompt") ?? process.env.SEED_PROMPT_FILE ?? DEFAULT_PROMPT);
const usingDefault = promptFile === DEFAULT_PROMPT;
const prompt = readFileSync(promptFile, "utf8").replace(/<!--[\s\S]*?-->/g, "").trim();
const BIN = fileURLToPath(new URL("../node_modules/.bin/agent-sdk", import.meta.url));

console.log(`Seed prompt: ${promptFile}`);
console.log(`Salesforce MCP: ${MCP_URL}${dryRun ? " (dry run: write tools off)" : ""}`);

const existing = demoAccountIds();
if (existing.length && !dryRun) {
  if (!flag("--reset")) {
    console.log(`The demo org is already seeded (${existing.length} accounts with Site = '${DEMO_SITE}'). Run \`npm run seed -- --reset\` to recreate it.`);
    process.exit(0);
  }
  deleteDemoAccounts(existing);
  console.log(`Deleted ${existing.length} demo accounts and their related records.`);
}

const d = new Date();
const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const message = `Today is ${today}. Mode: ${dryRun ? "DRY RUN" : "LIVE"}.\n\nSeed prompt:\n\n${prompt}`;

console.log("Running the seeding agent (seeder/). This takes a few minutes...");
mkdirSync(join(ROOT, "reports"), { recursive: true });
const trace = join(ROOT, "reports", `seed-${dryRun ? "plan" : "run"}.ndjson`);
const run = spawnSync(BIN, ["run", "--dir", join(ROOT, "seeder"), "--message", message, "--trace", trace, "--no-stream", "--timeout-ms", "900000"], {
  cwd: ROOT,
  env: { ...process.env, SEED_DRY_RUN: dryRun ? "1" : "0" },
  stdio: ["ignore", "ignore", "inherit"],
});
const events = existsSync(trace)
  ? readFileSync(trace, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as TraceEvent)
  : [];
const done = events.findLast((e) => e.type === "turn.completed" || e.type === "turn.failed");
if (!done || done.type === "turn.failed") {
  console.error(`The seeding agent failed (exit ${run.status}): ${done?.data?.message ?? "no result"}. Trace: ${trace}`);
  process.exit(1);
}
const reply = String(done.data?.result ?? "");
const tools = events.filter((e) => e.type === "actions.requested").flatMap((e) => e.data?.calls ?? []).map((c) => c.toolName);
const count = (name: string) => tools.filter((t) => t === name).length;
console.log(`Agent tool calls: ${[...new Set(tools)].map((t) => `${t} ×${count(t)}`).join(", ") || "none"}`);
console.log(`Trace: ${trace}`);
const summary = reply.match(/^.*SEEDED:.*$/m)?.[0]?.replace(/`/g, "").trim();
if (summary) console.log(summary);

if (dryRun) {
  const file = join(ROOT, "reports", "seed-plan.md");
  writeFileSync(file, reply + "\n");
  console.log(`Plan written to ${file}. Nothing was created.`);
  process.exit(0);
}

const got = demoCounts();
console.log(`In the org now (Site = '${DEMO_SITE}'): ${Object.entries(got).map(([k, v]) => `${v} ${k}`).join(", ")}`);
if (usingDefault) {
  const want = { ...fixtureCounts, tasks: fixtures.tasks.length };
  const off = Object.entries(want).filter(([k, v]) => got[k as keyof typeof got] !== v);
  if (off.length) {
    console.error(`Expected ${Object.entries(want).map(([k, v]) => `${v} ${k}`).join(", ")}. Re-run \`npm run seed -- --reset\`, or use \`npm run seed:fixtures -- --reset\` for an exact load.`);
    process.exit(1);
  }
  console.log("Matches the default seed prompt.");
}
if (got.accounts === 0) process.exit(1);

interface TraceEvent {
  type: string;
  data?: { result?: string; message?: string; calls?: Array<{ toolName: string }> };
}
