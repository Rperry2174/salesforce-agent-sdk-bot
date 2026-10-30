/**
 * Expected answers, derived from the seed data instead of typed by hand.
 * If someone edits fixtures/seed/*.json, these move with it, and the offline
 * suite (evals/fixtures.eval.ts) tells you whether the live evals still make sense.
 */
import { accountName, dayOffset, seed } from "./fixtures.js";

const CLOSED = new Set(["Closed Won", "Closed Lost"]);

export const openOpportunities = seed.opportunities.filter((o) => !CLOSED.has(o.StageName));

/** Open and past its close date, or open with no next step. */
export const staleOpportunities = openOpportunities
  .filter((o) => dayOffset(o.CloseDate) < 0 || !o.NextStep?.trim())
  .map((o) => o.Name)
  .sort();

/** Open pipeline per stage, in the order Salesforce lists the standard stages. */
const STAGE_ORDER = [
  "Prospecting", "Qualification", "Needs Analysis", "Value Proposition",
  "Id. Decision Makers", "Perception Analysis", "Proposal/Price Quote", "Negotiation/Review",
];
export const pipelineByStage: Array<{ stage: string; amount: number; count: number }> = STAGE_ORDER
  .map((stage) => {
    const rows = openOpportunities.filter((o) => o.StageName === stage);
    return { stage, amount: rows.reduce((s, o) => s + o.Amount, 0), count: rows.length };
  })
  .filter((r) => r.count > 0);

export const openPipelineTotal = openOpportunities.reduce((s, o) => s + o.Amount, 0);

export const openHighPriorityCases = seed.cases
  .filter((c) => c.Priority === "High" && c.Status !== "Closed")
  .map((c) => ({ account: accountName(c.account), subject: c.Subject }));

const daysSinceLastActivity = (accountRef: string): number | null => {
  const offsets = seed.tasks.filter((t) => t.account === accountRef).map((t) => dayOffset(t.ActivityDate));
  return offsets.length ? -Math.max(...offsets) : null;
};

/**
 * The at-risk rubric from bot/skills/at-risk-rubric.md, applied to the seed:
 *  1. two or more open High-priority cases, or
 *  2. an open renewal with no logged activity in 30+ days, or
 *  3. a contact whose title says they left the company.
 */
export function atRiskReasons(accountRef: string): string[] {
  const reasons: string[] = [];
  const highCases = seed.cases.filter((c) => c.account === accountRef && c.Priority === "High" && c.Status !== "Closed");
  if (highCases.length >= 2) reasons.push(`${highCases.length} open High-priority cases`);
  const renewal = openOpportunities.find((o) => o.account === accountRef && /renewal/i.test(o.Name));
  const quiet = daysSinceLastActivity(accountRef);
  if (renewal && (quiet === null || quiet >= 30)) reasons.push("open renewal with no recent activity");
  if (seed.contacts.some((c) => c.account === accountRef && /left the company/i.test(c.Title))) reasons.push("champion left");
  return reasons;
}

export const atRiskAccounts = seed.accounts
  .filter((a) => a.Type !== "Prospect" && atRiskReasons(a.ref).length > 0)
  .map((a) => a.Name)
  .sort();

/** Customers the rubric says are healthy. The at-risk eval must not flag them. */
export const healthyCustomers = seed.accounts
  .filter((a) => a.Type === "Customer - Direct" && atRiskReasons(a.ref).length === 0)
  .map((a) => a.Name)
  .sort();

export const counts = {
  accounts: seed.accounts.length,
  contacts: seed.contacts.length,
  opportunities: seed.opportunities.length,
  cases: seed.cases.length,
};

/** Format 935000 as "935,000" the way the bot is told to print money. */
export const money = (n: number) => n.toLocaleString("en-US");

/** Matches 935,000 / 935000 / $935K / 935k, so number formatting doesn't fail a correct answer. */
export function moneyPattern(n: number): RegExp {
  const k = n % 1000 === 0 ? `|\\$?${n / 1000}\\s?[kK]\\b` : "";
  const m = n % 10000 === 0 ? `|\\$?${String(n / 1000000).replace(".", "\\.")}\\s?[mM]\\b` : "";
  return new RegExp(`\\$?${money(n).replace(/,/g, ",?")}(\\.00)?${k}${m}`);
}
