import { defineConnection } from "@grok/agent-sdk/connections";
import { MCP_URL, SERVER } from "../../config/salesforce.js";

// The filename is the connection name: `npm run auth` runs `agent-sdk mcp oauth salesforce`,
// and the client id comes from MCP_OAUTH_SALESFORCE_CLIENT_ID.
export default defineConnection({
  url: MCP_URL,
  oauth: true, // OAuth 2.0 authorization code + PKCE against your External Client App
  advertiseTools: true, // the model calls the server's own tool names (discover, dispatch_readonly, ...)
  description: `Salesforce Hosted MCP (${SERVER})`,
});
