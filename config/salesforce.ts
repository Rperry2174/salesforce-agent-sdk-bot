/**
 * The one place that knows which Salesforce MCP server the bot talks to and
 * which of that server's tools mean "find", "read" and "write".
 *
 * Evals never hard-code tool names. They ask this map, so switching servers is
 * one environment variable (or one line below) and the eval files stay the same.
 */
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Load .env.local then .env from the repo root, so every entry point (dev, eval,
// mcp oauth, scripts) sees the same settings. Real environment variables win.
const ROOTS = new Set([join(dirname(fileURLToPath(import.meta.url)), ".."), process.cwd()]);
for (const root of ROOTS) {
  for (const file of [".env.local", ".env"]) {
    const path = join(root, file);
    if (existsSync(path)) process.loadEnvFile(path);
  }
}

export type ServerId = "platform/headless-360" | "platform/sobject-all";

export const SERVER: ServerId =
  (process.env.SALESFORCE_MCP_SERVER as ServerId | undefined) ?? "platform/headless-360";

/** `sandbox` (default) covers sandboxes and scratch orgs. Developer Edition orgs use `production`. */
export const ORG_TYPE = process.env.SALESFORCE_ORG_TYPE === "production" ? "production" : "sandbox";

/** Salesforce REST API version used in every URL the bot and seed script send. */
export const API_VERSION = "v67.0";

export const MCP_URL =
  process.env.SALESFORCE_MCP_URL ??
  `https://api.salesforce.com/platform/mcp/v1/${ORG_TYPE === "sandbox" ? "sandbox/" : ""}${SERVER}`;

export interface ToolMap {
  /** Tools that look up what the API can do. */
  find: string[];
  /** Tools that read records and never change data. */
  read: string[];
  /** Tools that create, update or delete data. A read-only question must never call these. */
  write: string[];
}

const TOOL_MAPS: Record<ServerId, ToolMap> = {
  "platform/headless-360": {
    find: ["discover", "describe"],
    read: ["dispatch_readonly"],
    write: ["dispatch"],
  },
  "platform/sobject-all": {
    find: ["getObjectSchema", "getUserInfo"],
    read: ["soqlQuery", "find", "listRecentSobjectRecords", "getRelatedRecords"],
    write: ["createSobjectRecord", "updateSobjectRecord", "updateRelatedRecord", "deleteSobjectRecord"],
  },
};

export const TOOLS: ToolMap = TOOL_MAPS[SERVER] ?? TOOL_MAPS["platform/headless-360"];

/** Written into the Description of every seeded record, so demo data is easy to find and remove. */
export const SEED_MARKER = "[sf-bot-demo]";
