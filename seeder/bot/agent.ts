import { defineAgent } from "@grok/agent-sdk";

// The seeding agent behind `npm run seed`. It reads a plain-English description
// of demo data and creates those records through the same Salesforce MCP
// connection the bot uses. It has no file, shell or edit tools.
export default defineAgent({
  name: "salesforce-seeder",
  description: "Creates fictional Salesforce demo records from a natural-language seed prompt, through the Salesforce Hosted MCP.",
  tools: [],
});
