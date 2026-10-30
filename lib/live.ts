/**
 * Decides whether the live evals can reach Salesforce. When they can't, every
 * live case ends as "skipped" with this message instead of failing.
 */
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { MCP_URL } from "../config/salesforce.js";

const authFile = () =>
  join(process.env.AGENT_SERVE_CONFIG_DIR ?? join(process.env.XDG_CONFIG_HOME ?? join(homedir(), ".config"), "agent-serve"), "mcp-auth.json");

const normalize = (url: string) => {
  const u = new URL(url);
  return `${u.origin}${u.pathname.replace(/\/$/, "")}`;
};

/** True when `npm run auth` stored a token for this exact MCP URL (we only check presence, never read the value out). */
function hasStoredToken(): boolean {
  const file = authFile();
  if (!existsSync(file)) return false;
  try {
    const entries = JSON.parse(readFileSync(file, "utf8")) as Record<string, { resourceUrl?: string; tokens?: unknown }>;
    return Object.values(entries).some((e) => e?.resourceUrl === normalize(MCP_URL) && e.tokens != null);
  } catch {
    return false;
  }
}

export function salesforceSkipReason(): string | undefined {
  if (process.env.MCP_OAUTH_SALESFORCE_ACCESS_TOKEN?.trim()) return undefined;
  if (!process.env.MCP_OAUTH_SALESFORCE_CLIENT_ID?.trim()) {
    return "Salesforce is not connected: set MCP_OAUTH_SALESFORCE_CLIENT_ID (README > Set up your org), then run `npm run auth`.";
  }
  if (!hasStoredToken()) {
    return `No Salesforce token for ${MCP_URL}: run \`npm run auth\` once to sign in to your demo org.`;
  }
  return undefined;
}
