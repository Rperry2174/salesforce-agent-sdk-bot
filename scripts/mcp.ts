// Call a Salesforce MCP tool directly through the Agent SDK (`agent-sdk tool call`).
// No model turn and no Cursor credential: it reuses the bot's connection and the OAuth tokens from `npm run auth`.
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { API_VERSION, TOOLS, SERVER } from "../config/salesforce.js";

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
  const response = JSON.parse(stdout) as { ok?: boolean; result?: unknown; error?: { message?: string; hint?: string } };
  if (response.error || response.ok === false) {
    const err = response.error ?? {};
    throw new Error(`${tool} failed: ${err.message ?? "unknown error"}${err.hint ? ` (${err.hint})` : ""}`);
  }
  return parseResult(response.result);
}

/** MCP results arrive as text content; most Salesforce responses are JSON inside it. */
function parseResult(result: unknown): unknown {
  const content = (result as { content?: Array<{ type: string; text?: string }> })?.content;
  const text = typeof result === "string" ? result : content?.find((c) => c.type === "text")?.text;
  if (text === undefined) return result;
  try {
    return unwrapDispatch(JSON.parse(text));
  } catch {
    return text;
  }
}

/**
 * Headless 360's `dispatch` and `dispatch_readonly` describe the REST call they
 * made (`{ status_code, url, body }`) instead of returning the Salesforce
 * payload at the top level. Callers want the payload.
 */
function unwrapDispatch(value: unknown): unknown {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return value;
  const wrapper = value as Record<string, unknown>;
  if (!("body" in wrapper) || !("status_code" in wrapper || "statusCode" in wrapper)) return value;
  if (typeof wrapper.body !== "string") return wrapper.body;
  try {
    return JSON.parse(wrapper.body);
  } catch {
    return wrapper.body;
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
