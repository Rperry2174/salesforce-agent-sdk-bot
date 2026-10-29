// npm run seed:fixtures: load fixtures/seed/*.json exactly, with no model in the loop.
// The deterministic twin of `npm run seed` (which seeds from a natural-language prompt).
//   npm run seed:fixtures                 create the records through the MCP dispatch tool
//   npm run seed:fixtures -- --dry-run    write the payload to reports/seed-tree.json and change nothing
//   npm run seed:fixtures -- --reset      delete the demo accounts (and their children) first, then seed
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { API_VERSION, MCP_URL } from "../config/salesforce.js";
import { buildAccountTree, seed } from "../lib/fixtures.js";
import { ROOT, callTool, deleteDemoAccounts, demoAccountIds, requireH360 } from "./mcp.js";

const args = new Set(process.argv.slice(2));
const tree = buildAccountTree();

if (args.has("--dry-run")) {
  mkdirSync(join(ROOT, "reports"), { recursive: true });
  const file = join(ROOT, "reports", "seed-tree.json");
  writeFileSync(file, JSON.stringify(tree, null, 2));
  console.log(`Wrote ${file}. Load it yourself with: sf data import tree --files ${file} --target-org <alias>`);
  process.exit(0);
}

requireH360("Seeding");
console.log(`Seeding through ${MCP_URL}`);
const base = `/services/data/${API_VERSION}`;
const existing = demoAccountIds();

if (existing.length && !args.has("--reset")) {
  console.log(`The demo accounts already exist (${existing.length}). Run \`npm run seed:fixtures -- --reset\` to recreate them.`);
  process.exit(0);
}
if (existing.length) {
  deleteDemoAccounts(existing);
  console.log(`Deleted ${existing.length} demo accounts and their related records.`);
}

const result = callTool("dispatch", { url: `${base}/composite/tree/Account`, method: "POST", body: tree }) as {
  hasErrors?: boolean;
  results?: Array<{ referenceId: string; id?: string; errors?: Array<{ message: string }> }>;
};
if (!result || result.hasErrors || !Array.isArray(result.results)) {
  console.error("Seeding failed:", JSON.stringify(result, null, 2));
  process.exit(1);
}
console.log(`Created ${result.results.length} records (${seed.accounts.length} accounts, ${seed.contacts.length} contacts, ${seed.opportunities.length} opportunities, ${seed.cases.length} cases, ${seed.tasks.length} tasks).`);
