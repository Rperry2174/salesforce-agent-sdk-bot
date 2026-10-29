// npm run smoke: prove the Salesforce connection works before you spend model turns on evals.
import { API_VERSION, MCP_URL, SERVER, TOOLS } from "../config/salesforce.js";
import { callTool, soql } from "./mcp.js";

console.log(`Salesforce MCP: ${MCP_URL}`);
let failed = false;
const step = (name: string, run: () => string) => {
  try {
    console.log(`  ok    ${name}: ${run()}`);
  } catch (error) {
    failed = true;
    console.log(`  FAIL  ${name}: ${(error as Error).message}`);
  }
};

if (SERVER.endsWith("headless-360")) {
  step("discover", () => {
    const out = JSON.stringify(callTool("discover", { query: "run a SOQL query" }));
    return out.includes(`/services/data/`) ? "found the SOQL query endpoint" : `responded (${out.length} bytes)`;
  });
}
step(`${TOOLS.read[0]} (SOQL)`, () => {
  const counts = ["Account", "Contact", "Opportunity", "Case"].map((o) => `${o} ${soql(`SELECT COUNT() FROM ${o}`).totalSize ?? "?"}`);
  return counts.join(", ");
});
step("demo data", () => {
  const r = soql("SELECT COUNT() FROM Account WHERE Name = 'Halcyon Freight Co.'");
  return r.totalSize ? "seeded" : "not seeded yet, run `npm run seed`";
});

if (failed) {
  console.log(`\nIf a call failed with an auth error, run \`npm run auth\`. API version in use: ${API_VERSION}.`);
  process.exit(1);
}
