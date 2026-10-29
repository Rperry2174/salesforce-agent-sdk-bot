/**
 * Offline suite: no model, no Salesforce, no credentials. Runs in CI.
 *
 * It checks the data the live evals depend on: the seed is fictional and
 * marked, the expected answers derived from it are the ones the scenarios were
 * designed around, and every eval case is well-formed.
 */
import { defineEval, equals } from "@grok/agent-sdk/evals";
import { claim } from "../lib/assert-salesforce.js";
import { MCP_URL, SEED_MARKER, SERVER, TOOLS } from "../config/salesforce.js";
import { evalCases, knownTokens, textChecks } from "../lib/cases.js";
import {
  atRiskAccounts, counts, healthyCustomers, openPipelineTotal, pipelineByStage, staleOpportunities,
} from "../lib/expected.js";
import { buildAccountTree, resolveDate, seed } from "../lib/fixtures.js";

const allRecords = [...seed.accounts, ...seed.contacts, ...seed.opportunities, ...seed.cases, ...seed.tasks];
const allText = JSON.stringify(seed);

export default defineEval({
  tags: ["offline"],
  cases: [
    {
      id: "seed-is-fictional",
      description: "Every seeded record carries the demo marker and every email is on a reserved example domain",
      async test(t) {
        t.check(allRecords.filter((r) => !r.Description.startsWith(SEED_MARKER)).length, equals(0));
        const emails = seed.contacts.map((c) => c.Email);
        t.check(emails.filter((e) => !/@([a-z0-9-]+\.)*example\.(com|org|net)$/.test(e)), equals([]));
        const urls = allText.match(/https?:\/\/[^"\s]+/g) ?? [];
        t.check(urls.filter((u) => !/\.example\.(com|org|net)/.test(u)), equals([]));
        t.metric("records", allRecords.length);
      },
    },
    {
      id: "seed-counts",
      description: "The org-tour eval expects 8 accounts, 12 opportunities and 8 cases",
      async test(t) {
        t.check(counts, equals({ accounts: 8, contacts: 16, opportunities: 12, cases: 8 }));
      },
    },
    {
      id: "at-risk-set",
      description: "The at-risk rubric flags exactly Halcyon Freight and Brightwater Health",
      async test(t) {
        t.check(atRiskAccounts, equals(["Brightwater Health Partners", "Halcyon Freight Co."]));
        claim(t, "Cobalt Mesa and Juniper Ridge are healthy", healthyCustomers.includes("Cobalt Mesa Energy") && healthyCustomers.includes("Juniper Ridge Outfitters"));
        t.metric("at risk", atRiskAccounts.join(", "));
      },
    },
    {
      id: "stale-set",
      description: "Stale pipeline is exactly the two opportunities designed to be stale",
      async test(t) {
        t.check(staleOpportunities, equals(["Marlowe & Finch - Claims Automation", "Quillfeather - Analytics Add-on"]));
      },
    },
    {
      id: "pipeline-totals",
      description: "Open pipeline by stage adds up to $935,000",
      async test(t) {
        t.check(openPipelineTotal, equals(935_000));
        t.check(pipelineByStage.reduce((s, r) => s + r.amount, 0), equals(openPipelineTotal));
        t.check(Object.fromEntries(pipelineByStage.map((r) => [r.stage, r.amount])), equals({
          Prospecting: 30_000,
          Qualification: 85_000,
          "Needs Analysis": 75_000,
          "Value Proposition": 110_000,
          "Proposal/Price Quote": 215_000,
          "Negotiation/Review": 420_000,
        }));
        t.metric("total", openPipelineTotal);
      },
    },
    {
      id: "seed-tree",
      description: "The seed payload nests every record under its account, with real dates",
      async test(t) {
        const tree = buildAccountTree(new Date("2026-01-15T12:00:00Z"));
        t.check(tree.records.length, equals(8));
        const nested = JSON.stringify(tree);
        t.check((nested.match(/"type":"(Contact|Opportunity|Case|Task)"/g) ?? []).length, equals(46));
        t.check(nested.includes("today"), equals(false));
        t.check(resolveDate("today-21d", new Date("2026-01-15T12:00:00Z")), equals("2025-12-25"));
      },
    },
    {
      id: "eval-cases-well-formed",
      description: "Ten live cases, unique ids, valid paths, and every text check resolves",
      async test(t) {
        t.check(evalCases.length, equals(10));
        t.check(new Set(evalCases.map((c) => c.id)).size, equals(evalCases.length));
        for (const c of evalCases) {
          claim(t, `${c.id}: path is read, write or guardrail`, ["read", "write", "guardrail"].includes(c.path));
          claim(t, `${c.id}: has a prompt or turns, not both`, Boolean(c.prompt) !== Boolean(c.turns?.length));
          claim(t, `${c.id}: write cases name the target record`, c.path !== "write" || Boolean(c.writes && c.whatIdOf));
          claim(t, `${c.id}: text checks resolve`, textChecks([...(c.mustMention ?? []), ...(c.mustNotMention ?? [])]).length > 0);
        }
        t.metric("tokens", knownTokens.join(", "));
      },
    },
    {
      id: "expected-entities-exist",
      description: "Every record a live eval names exists in the seed data",
      async test(t) {
        const names = [...seed.accounts.map((a) => a.Name), ...seed.opportunities.map((o) => o.Name)];
        for (const c of evalCases.filter((r) => r.whatIdOf)) {
          t.check(names.includes(c.whatIdOf!), equals(true));
        }
        const people = seed.contacts.map((c) => `${c.FirstName} ${c.LastName}`);
        t.check(people.includes("Priya Natarajan") && people.includes("Leo Brandt"), equals(true));
      },
    },
    {
      id: "mcp-config",
      description: "The bot points at the Salesforce Hosted MCP and knows its read and write tools",
      async test(t) {
        claim(t, "uses the Salesforce Hosted MCP URL", MCP_URL.startsWith("https://api.salesforce.com/platform/mcp/v1/") || Boolean(process.env.SALESFORCE_MCP_URL));
        t.check(TOOLS.read.some((n) => TOOLS.write.includes(n)), equals(false));
        t.metric("server", SERVER);
        t.metric("read", TOOLS.read.join(", "));
        t.metric("write", TOOLS.write.join(", "));
      },
    },
  ],
});
