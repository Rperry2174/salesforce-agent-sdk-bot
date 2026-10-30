/**
 * Loads fixtures/eval-cases.json, the table that drives the live evals.
 *
 * Each row is one eval. Text checks are plain strings (case-insensitive),
 * `/regex/` strings, or `{token}` references to answers computed from the seed
 * data in lib/expected.ts, so the expected answers never drift from the data.
 */
import rows from "../fixtures/eval-cases.json" with { type: "json" };
import { atRiskAccounts, healthyCustomers, moneyPattern, openPipelineTotal, pipelineByStage, staleOpportunities } from "./expected.js";
import { seed } from "./fixtures.js";

export type CasePath = "read" | "write" | "guardrail";

export interface EvalCaseRow {
  id: string;
  path: CasePath;
  tags: string[];
  useCase: string;
  description: string;
  /** One prompt, or `turns` for a multi-turn conversation in one session. */
  prompt?: string;
  turns?: string[];
  /** sObjects the read calls must touch. */
  touches?: string[];
  /** For write cases: the sObject to create, and the record its WhatId must point at. */
  writes?: string;
  whatIdOf?: string;
  mustMention?: string[];
  mustNotMention?: string[];
  /** One rubric line, graded by the judge model. */
  rubric?: string;
  maxToolCalls?: number;
}

export const evalCases = rows as EvalCaseRow[];

export interface TextCheck {
  label: string;
  pattern: RegExp;
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const loose = (s: string) => new RegExp(escape(s).replace(/\s+/g, "\\s+"), "i");

/** "Halcyon Freight Co." → /Halcyon/i. Account names are distinctive by their first word. */
const accountCheck = (name: string): TextCheck => ({ label: name, pattern: loose(name.split(" ")[0]!) });
/** "Marlowe & Finch - Claims Automation" → /Claims Automation/i, so "Claims Automation (Marlowe & Finch)" also passes. */
const opportunityCheck = (name: string): TextCheck => ({ label: name, pattern: loose(name.split(" - ").at(-1)!) });
const moneyCheck = (label: string, n: number): TextCheck => ({ label: `${label} ${n}`, pattern: moneyPattern(n) });

const TOKENS: Record<string, () => TextCheck[]> = {
  atRiskAccounts: () => atRiskAccounts.map(accountCheck),
  healthyCustomers: () => healthyCustomers.map(accountCheck),
  staleOpportunities: () => staleOpportunities.map(opportunityCheck),
  pipelineByStage: () => [
    ...pipelineByStage.map((r) => moneyCheck(r.stage, r.amount)),
    moneyCheck("Total", openPipelineTotal),
  ],
  halcyonRenewalAmount: () => {
    const opp = seed.opportunities.find((o) => o.ref === "halcyon-renewal")!;
    return [moneyCheck(opp.Name, opp.Amount)];
  },
};

export function textChecks(entries: string[] = []): TextCheck[] {
  return entries.flatMap((entry) => {
    const token = /^\{(\w+)\}$/.exec(entry);
    if (token) {
      const make = TOKENS[token[1]!];
      if (!make) throw new Error(`Unknown token ${entry} in fixtures/eval-cases.json`);
      return make();
    }
    const re = /^\/(.+)\/([a-z]*)$/.exec(entry);
    if (re) return [{ label: entry, pattern: new RegExp(re[1]!, re[2] || "i") }];
    return [{ label: entry, pattern: loose(entry) }];
  });
}

export const knownTokens = Object.keys(TOKENS);
