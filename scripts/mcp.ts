// Call a Salesforce MCP tool directly through the Agent SDK (`agent-sdk tool call`).
// No model turn and no Cursor credential: it reuses the bot's connection and the OAuth tokens from `npm run auth`.
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { API_VERSION, DEMO_SITE, TOOLS, SERVER } from "../config/salesforce.js";

export const ROOT = fileURLToPath(new URL("..", import.meta.url));
const BIN = fileURLToPath(new URL("../node_modules/.bin/agent-sdk", import.meta.url));

export function callTool(tool: string, input: Record<string, unknown>): unknown {
  let stdout: string;
  try {
    stdout = execFileSync(BIN, ["tool", "call", tool, "--dir", ROOT, "--json", "--input", JSON.stringify(input)], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch (error) {
    const e = error as { stdout?: string; stderr?: string };
    stdout = e.stdout ?? "";
    if (!stdout.trim()) throw new Error(`${tool} failed: ${(e.stderr ?? String(error)).trim().split("\n").slice(-3).join(" ")}`);
  }
  const response = JSON.parse(stdout) as {
    ok?: boolean; result?: unknown; message?: string; errorMessage?: string;
    error?: string | { message?: string; hint?: string };
  };
  if (response.error || response.ok === false) {
    const err = typeof response.error === "object" ? response.error : {};
    const message = response.errorMessage ?? err.message ?? response.message ?? String(response.error ?? "unknown error");
    throw new Error(`${tool} failed: ${message}${err.hint ? ` (${err.hint})` : ""}`);
  }
  return parseResult(response.result);
}

/** MCP results arrive as text content; most Salesforce responses are JSON inside it. */
function parseResult(result: unknown): unknown {
  const content = (result as { content?: Array<{ type: string; text?: string }> })?.content;
  const text = typeof result === "string" ? result : content?.find((c) => c.type === "text")?.text;
  if (text === undefined) return result;
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return text;
  }
  return unwrapDispatch(parsed);
}

/**
 * Headless 360 wraps every dispatch response as `{ status_code, body, url }`.
 * Return the Salesforce body, and turn a non-2xx status into an error.
 */
function unwrapDispatch(value: unknown): unknown {
  const v = value as { status_code?: number; body?: unknown } | null;
  if (!v || typeof v !== "object" || typeof v.status_code !== "number" || !("body" in v)) return value;
  if (v.status_code >= 300) {
    const detail = Array.isArray(v.body) ? (v.body as Array<{ message?: string }>).map((e) => e.message).join("; ") : JSON.stringify(v.body);
    throw new Error(`Salesforce returned ${v.status_code}: ${detail}`);
  }
  if (typeof v.body !== "string") return v.body;
  try {
    return JSON.parse(v.body);
  } catch {
    return v.body;
  }
}

const isH360 = SERVER.endsWith("headless-360");

/** Run SOQL through whichever read tool the configured server exposes. */
export function soql(q: string): { totalSize?: number; records?: Array<Record<string, unknown>> } {
  if (isH360) {
    return callTool(TOOLS.read[0]!, { url: `/services/data/${API_VERSION}/query`, method: "GET", queryParams: { q } }) as never;
  }
  return callTool("soqlQuery", { query: q }) as never;
}

export const requireH360 = (what: string) => {
  if (!isH360) {
    console.error(`${what} uses the Headless 360 dispatch tool. Set SALESFORCE_MCP_SERVER=platform/headless-360, or load the data with the Salesforce CLI (see README).`);
    process.exit(1);
  }
};

/** Ids of the seeded demo accounts (Account Site = sf-bot-demo). */
export function demoAccountIds(): string[] {
  const r = soql(`SELECT Id FROM Account WHERE Site = '${DEMO_SITE}' LIMIT 200`);
  return (r.records ?? []).map((a) => String(a.Id));
}

/** Delete the demo accounts. Salesforce cascades to their contacts, opportunities, cases and tasks. */
export function deleteDemoAccounts(ids: string[]): void {
  requireH360("Reset");
  for (let i = 0; i < ids.length; i += 200) {
    callTool(TOOLS.write[0]!, {
      url: `/services/data/${API_VERSION}/composite/sobjects`,
      method: "DELETE",
      queryParams: { ids: ids.slice(i, i + 200).join(","), allOrNone: "false" },
    });
  }
}

/** Record counts in the demo book of business, the same scope the bot queries. */
export function demoCounts(): Record<"accounts" | "contacts" | "opportunities" | "cases" | "tasks", number> {
  const n = (q: string) => soql(q).totalSize ?? 0;
  return {
    accounts: n(`SELECT COUNT() FROM Account WHERE Site = '${DEMO_SITE}'`),
    contacts: n(`SELECT COUNT() FROM Contact WHERE Account.Site = '${DEMO_SITE}'`),
    opportunities: n(`SELECT COUNT() FROM Opportunity WHERE Account.Site = '${DEMO_SITE}'`),
    cases: n(`SELECT COUNT() FROM Case WHERE Account.Site = '${DEMO_SITE}'`),
    tasks: n(`SELECT COUNT() FROM Task WHERE Account.Site = '${DEMO_SITE}'`),
  };
}
