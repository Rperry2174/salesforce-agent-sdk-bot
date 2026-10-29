/**
 * Assertion helpers shared by the live evals. Each one reads tool names from
 * config/salesforce.ts, so the same eval works on Headless 360 or sObject All.
 */
import { deriveRunFacts, type EvalTestContext, type EvalToolCallFact } from "@grok/agent-sdk/evals";
import { TOOLS } from "../config/salesforce.js";

type Facts = { toolCalls: EvalToolCallFact[] };
const facts = (t: EvalTestContext): Facts => deriveRunFacts(t.events);

const text = (v: unknown) => (typeof v === "string" ? v : JSON.stringify(v ?? ""));

/** Every Salesforce MCP tool call in the run, in order. */
export function salesforceCalls(t: EvalTestContext): EvalToolCallFact[] {
  const known = new Set([...TOOLS.find, ...TOOLS.read, ...TOOLS.write]);
  return facts(t).toolCalls.filter((c) => known.has(c.toolName));
}

export const readCalls = (t: EvalTestContext) => facts(t).toolCalls.filter((c) => TOOLS.read.includes(c.toolName));
export const writeCalls = (t: EvalTestContext) => facts(t).toolCalls.filter((c) => TOOLS.write.includes(c.toolName));

/** "discover → dispatch_readonly ×3", for the playground card. */
export function toolPath(t: EvalTestContext): string {
  const parts: Array<[string, number]> = [];
  for (const c of salesforceCalls(t)) {
    const last = parts.at(-1);
    if (last && last[0] === c.toolName) last[1] += 1;
    else parts.push([c.toolName, 1]);
  }
  return parts.length ? parts.map(([n, k]) => (k > 1 ? `${n} ×${k}` : n)).join(" → ") : "(no Salesforce tools)";
}

/** Does any read call mention this sObject (in its URL, SOQL or args)? */
export const readTouches = (t: EvalTestContext, sobject: string) =>
  readCalls(t).some((c) => new RegExp(`\\b${sobject}\\b`, "i").test(text(c.input)));

/** Record the observed path and the SOQL the bot ran, so they show on the case card and under --verbose. */
export function recordTrace(t: EvalTestContext, expected: string) {
  t.metric("expected", expected);
  t.metric("got", toolPath(t));
  t.metric("salesforce calls", salesforceCalls(t).length);
  for (const c of readCalls(t)) t.log(`${c.toolName} ${text(c.input).slice(0, 400)}`);
}

/**
 * Read-only question: the bot looked something up, read records with a read
 * tool after that, and never called a write tool.
 */
export function assertReadPath(t: EvalTestContext) {
  t.calledTool(TOOLS.read[0]!, { status: "completed" });
  if (TOOLS.find[0] === "discover") t.toolOrder(["discover", TOOLS.read[0]!]).soft();
  assertNoWrites(t);
}

/** No create, update or delete of any kind. */
export function assertNoWrites(t: EvalTestContext) {
  for (const name of TOOLS.write) t.notCalledTool(name);
}

/**
 * Write request: the bot read first, then called the write tool to create a
 * record of `sobject` (for Headless 360: POST …/sobjects/Task).
 */
export function assertWritePath(t: EvalTestContext, sobject: string) {
  const write = TOOLS.write[0]!;
  t.calledTool(TOOLS.read[0]!, { status: "completed" });
  t.toolOrder([TOOLS.read[0]!, write]);
  t.calledTool(write, {
    status: "completed",
    input: (input: unknown) => new RegExp(`\\b${sobject}\\b`).test(text(input)) && !/"method"\s*:\s*"(DELETE|PATCH|PUT)"/i.test(text(input)),
  });
}

/** Salesforce record Ids for one sObject key prefix (006 = Opportunity) found in read outputs that mention `near`. */
export function idsSeenNear(t: EvalTestContext, near: string, prefix: string): string[] {
  const ids = new Set<string>();
  const re = new RegExp(`\\b${prefix}[A-Za-z0-9]{12}(?:[A-Za-z0-9]{3})?\\b`, "g");
  for (const c of readCalls(t)) {
    const out = text(c.output);
    if (!out.includes(near)) continue;
    // Look at a window around each mention so we pick the Id of that record, not its neighbours.
    for (let i = out.indexOf(near); i !== -1; i = out.indexOf(near, i + 1)) {
      for (const m of out.slice(Math.max(0, i - 400), i + 400).matchAll(re)) ids.add(m[0]);
    }
  }
  return [...ids];
}

/** The input of the first write call, as text (for body checks like WhatId). */
export const firstWriteInput = (t: EvalTestContext) => text(writeCalls(t)[0]?.input);

/** A labeled boolean check, so the playground shows what was claimed ("mentions Halcyon"), not just "true". */
// eventsSatisfy is the assertion that carries its label into the result name.
export const claim = (t: EvalTestContext, label: string, value: boolean) => t.eventsSatisfy(label, () => value);
