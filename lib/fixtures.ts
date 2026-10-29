/**
 * Typed access to the fictional seed data in fixtures/seed/.
 *
 * Dates are stored relative to the seeding day ("today+45d", "today-21d") so
 * the at-risk and stale scenarios never age out. `resolveDate` turns them into
 * real YYYY-MM-DD values when the seed script runs.
 */
import accounts from "../fixtures/seed/accounts.json" with { type: "json" };
import contacts from "../fixtures/seed/contacts.json" with { type: "json" };
import opportunities from "../fixtures/seed/opportunities.json" with { type: "json" };
import cases from "../fixtures/seed/cases.json" with { type: "json" };
import tasks from "../fixtures/seed/tasks.json" with { type: "json" };

export interface SeedAccount { ref: string; Name: string; Industry: string; Type: string; Website: string; Phone: string; Description: string }
export interface SeedContact { ref: string; account: string; FirstName: string; LastName: string; Title: string; Email: string; Description: string }
export interface SeedOpportunity { ref: string; account: string; Name: string; Amount: number; StageName: string; CloseDate: string; NextStep?: string; ForecastCategoryName?: string; Description: string }
export interface SeedCase { ref: string; account: string; Subject: string; Priority: string; Status: string; Origin: string; Description: string }
export interface SeedTask { ref: string; account: string; Subject: string; ActivityDate: string; Status: string; Priority: string; TaskSubtype: string; Description: string }

export const seed = {
  accounts: accounts as SeedAccount[],
  contacts: contacts as SeedContact[],
  opportunities: opportunities as SeedOpportunity[],
  cases: cases as SeedCase[],
  tasks: tasks as SeedTask[],
};

/** "today+45d" → offset in days (45). Throws on anything else. */
export function dayOffset(value: string): number {
  const m = /^today([+-]\d+)d$/.exec(value);
  if (!m) throw new Error(`Expected a relative date like "today+45d", got "${value}"`);
  return Number(m[1]);
}

/** Resolve a relative seed date against `today` (defaults to now), as YYYY-MM-DD. */
export function resolveDate(value: string, today = new Date()): string {
  const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  d.setUTCDate(d.getUTCDate() + dayOffset(value));
  return d.toISOString().slice(0, 10);
}

export function accountName(ref: string): string {
  const a = seed.accounts.find((x) => x.ref === ref);
  if (!a) throw new Error(`Unknown account ref "${ref}"`);
  return a.Name;
}

const strip = <T extends { ref: string; account?: string }>(r: T) => {
  const { ref: _ref, account: _account, ...fields } = r;
  return fields;
};

/**
 * Build one Salesforce sObject Tree payload (POST /composite/tree/Account):
 * each Account with its Contacts, Opportunities, Cases and Tasks nested under it.
 */
export function buildAccountTree(today = new Date()) {
  const records = seed.accounts.map((a) => {
    const mine = <T extends { account: string }>(rows: T[]) => rows.filter((r) => r.account === a.ref);
    const nest = (type: string, rows: Record<string, unknown>[]) =>
      rows.length ? { records: rows.map((r, i) => ({ attributes: { type, referenceId: `${a.ref.replace(/\W/g, "_")}_${type}_${i + 1}` }, ...r })) } : undefined;
    const tree: Record<string, unknown> = {
      attributes: { type: "Account", referenceId: a.ref.replace(/\W/g, "_") },
      ...strip(a),
    };
    const contactsNode = nest("Contact", mine(seed.contacts).map(strip));
    const oppsNode = nest("Opportunity", mine(seed.opportunities).map((o) => ({ ...strip(o), CloseDate: resolveDate(o.CloseDate, today) })));
    const casesNode = nest("Case", mine(seed.cases).map(strip));
    const tasksNode = nest("Task", mine(seed.tasks).map((t) => ({ ...strip(t), ActivityDate: resolveDate(t.ActivityDate, today) })));
    if (contactsNode) tree.Contacts = contactsNode;
    if (oppsNode) tree.Opportunities = oppsNode;
    if (casesNode) tree.Cases = casesNode;
    if (tasksNode) tree.Tasks = tasksNode;
    return tree;
  });
  return { records };
}
