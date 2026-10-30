import { defineAgent } from "@grok/agent-sdk";

export default defineAgent({
  name: "salesforce-bot",
  description: "Answers sales and support questions from Salesforce and logs activity, through Salesforce's Headless 360 MCP.",
  // Only the file reader (to open its skills). No shell, no edits: every
  // Salesforce action goes through the MCP tools, so every action is in the trace.
  tools: ["read"],
  hosting: {
    egressDomains: ["api.salesforce.com", "login.salesforce.com", "test.salesforce.com", "*.my.salesforce.com"],
    secretNames: [
      // External Client App consumer key (public client, PKCE). Not a secret on
      // its own, but kept out of source so each org brings its own app.
      "MCP_OAUTH_SALESFORCE_CLIENT_ID",
    ],
  },
});
