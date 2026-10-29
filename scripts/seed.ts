// npm run seed: load the fictional demo org (8 accounts with contacts, opportunities, cases and tasks).
//   npm run seed                 create the records through the MCP dispatch tool
//   npm run seed -- --dry-run    write the payload to reports/seed-tree.json and change nothing
//   npm run seed -- --reset      delete the demo accounts (and their children) first, then seed
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { API_VERSION, MCP_URL } from "../config/salesforce.js";
import { buildAccountTree, seed } from "../lib/fixtures.js";
import { ROOT, callTool, requireH360, soql } from "./mcp.js";

const args = new Set(process.argv.slice(2));
const tree = buildAccountTree();
const names = seed.accounts.map((a) => `'${a.Name.replace(/'/g, "\\'")}'`).join(", ");

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
// Account Name is not unique, so a dirty org can hold many matches. 200 is also the most ids the composite delete below takes.
const existing = (soql(`SELECT Id, Name FROM Account WHERE Name IN (${names}) LIMIT 200`).records ?? []) as Array<{ Id: string; Name: string }>;

if (existing.length && !args.has("--reset")) {
  console.log(`The demo accounts already exist (${existing.length} of ${seed.accounts.length}). Run \`npm run seed -- --reset\` to recreate them.`);
  process.exit(0);
}
if (existing.length) {
  // Deleting an Account cascades to its Contacts, Opportunities, Cases and Tasks.
  callTool("dispatch", { url: `${base}/composite/sobjects`, method: "DELETE", queryParams: { ids: existing.map((a) => a.Id).join(","), allOrNone: "false" } });
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
