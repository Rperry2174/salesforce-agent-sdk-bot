import { defineConnection } from "@grok/agent-sdk/connections";
import { MCP_URL, SERVER, TOOLS } from "../../../config/salesforce.js";

// Same server, client id (MCP_OAUTH_SALESFORCE_CLIENT_ID) and stored token as the bot's connection.
// `npm run seed -- --dry-run` sets SEED_DRY_RUN=1, which removes every write tool, so a dry run can't change the org.
export default defineConnection({
  url: MCP_URL,
  oauth: true,
  advertiseTools: true,
  description: `Salesforce Hosted MCP (${SERVER})`,
  ...(process.env.SEED_DRY_RUN === "1" ? { disallowedTools: TOOLS.write } : {}),
});
