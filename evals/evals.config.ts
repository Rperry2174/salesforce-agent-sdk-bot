import { defineEvalConfig } from "@grok/agent-sdk/evals";

export default defineEvalConfig({
  // Two at a time keeps live runs readable in the playground's Runs list.
  maxConcurrency: 2,
  timeoutMs: 180_000,
  judge: { model: "gpt-5.4-mini" },
});
