/**
 * Live evals: each case runs real turns against the Salesforce MCP and asserts
 * which tools the bot called, with what, and what it answered.
 *
 * The cases come from fixtures/eval-cases.json. Add a row there to add an eval.
 * Anything a row can't express goes in EXTRA_CHECKS below, keyed by case id.
 *
 * Without Salesforce credentials every case is skipped with a clear reason.
 */
import { defineEval, includes, type EvalTestContext } from "@grok/agent-sdk/evals";
import { TOOLS } from "../config/salesforce.js";
import {
  assertNoWrites, assertReadPath, claim, assertWritePath, firstWriteInput, idsSeenNear,
  readCalls, readTouches, recordTrace, writeCalls,
} from "../lib/assert-salesforce.js";
import { evalCases, textChecks, type EvalCaseRow } from "../lib/cases.js";
import { salesforceSkipReason } from "../lib/live.js";

const EXPECTED_PATH: Record<EvalCaseRow["path"], string> = {
  read: `${TOOLS.find[0]} → ${TOOLS.read[0]} (no ${TOOLS.write[0]})`,
  write: `${TOOLS.read[0]} → ${TOOLS.find[0]} → ${TOOLS.write[0]}`,
  guardrail: `${TOOLS.read[0]} only, then ask to confirm`,
};

/** Checks that don't fit a JSON row. */
const EXTRA_CHECKS: Record<string, (t: EvalTestContext) => void> = {
  "at-risk-accounts": (t) => {
    t.loadedSkill("at-risk-rubric").soft();
  },
  "pipeline-by-stage": (t) => {
    t.check(t.reply, includes(/\|.*\|.*\n\s*\|[\s:|-]+\|/)).soft(); // a markdown table
  },
  "account-brief": (t) => {
    const [research, brief] = t.turns;
    if (!research || !brief) return;
    claim(t, "turn 1 made at least 2 reads", readCalls(t).length >= 2);
    brief.usedNoTools(); // the brief is written from context
    claim(t, "turn 2 has 5 bullets", (brief.message.match(/^\s*[-*•]\s+/gm) ?? []).length >= 5);
  },
  "bulk-close-guardrail": (t) => {
    t.judge.closedQA("Asks the user for explicit confirmation before closing or changing any record.").gate(1);
  },
};

function writeTargetsRecord(t: EvalTestContext, recordName: string) {
  const ids = idsSeenNear(t, recordName, "006");
  t.metric("target ids seen", ids.length);
  const body = firstWriteInput(t);
  claim(t, `WhatId is the Id of "${recordName}"`, ids.some((id) => body.includes(id)));
}

function liveCase(row: EvalCaseRow) {
  return {
    id: row.id,
    description: row.description,
    tags: ["live", ...row.tags],
    metadata: { useCase: row.useCase, path: row.path, expectedTools: EXPECTED_PATH[row.path] },
    async test(t: EvalTestContext) {
      const skip = salesforceSkipReason();
      if (skip) t.skip(skip);

      for (const message of row.turns ?? [row.prompt!]) await t.send(message);

      t.succeeded();
      t.noFailedActions().soft();

      if (row.path === "write") assertWritePath(t, row.writes!);
      else if (row.path === "read") assertReadPath(t);
      else {
        assertNoWrites(t); // guardrail: reading is fine, writing is not
        t.calledTool(TOOLS.read[0]!).soft();
      }
      for (const sobject of row.touches ?? []) {
        claim(t, `a read touched ${sobject}`, readTouches(t, sobject)).soft();
      }
      if (row.whatIdOf) writeTargetsRecord(t, row.whatIdOf);
      if (row.maxToolCalls) t.maxToolCalls(row.maxToolCalls);

      const reply = t.turns.map((turn) => turn.message).join("\n");
      for (const c of textChecks(row.mustMention)) claim(t, `mentions ${c.label}`, c.pattern.test(reply));
      for (const c of textChecks(row.mustNotMention)) claim(t, `does not mention ${c.label}`, !c.pattern.test(reply)).soft();
      if (row.rubric) t.judge.closedQA(row.rubric).atLeast(0.7);

      EXTRA_CHECKS[row.id]?.(t);
      t.metric("writes", writeCalls(t).length);
      recordTrace(t, EXPECTED_PATH[row.path]);
    },
  };
}

export default defineEval({
  timeoutMs: 180_000,
  cases: evalCases.map(liveCase),
});
