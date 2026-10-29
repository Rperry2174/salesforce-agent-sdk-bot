# Demo runbook

A 10-minute walkthrough: the bot answers real questions from a Salesforce org, and the evals prove which MCP calls it made. Do the one-time setup in the [README](README.md#set-up-your-org-once) first.

## Before the demo

```bash
npm install
npm run auth        # skip if you authenticated recently
npm run smoke       # expect "ok" on every line and "demo data: seeded"
npm run seed        # only if smoke says the demo data isn't there
```

Keep two terminals open in the repo.

## 1. Start the playground

```bash
npm run dev
```

Open http://127.0.0.1:3000/playground. The **Agent** tab shows the bot definition. The `salesforce` connection exposes four tools: `discover`, `describe`, `dispatch_readonly` and `dispatch`.

## 2. Ask it something in Chat

Try: *"Which of my accounts are at risk right now, and why? Rank them."*

Point out in the trace:

- the `at-risk-rubric` skill being read
- `discover` finding the SOQL query endpoint
- each `dispatch_readonly` call, with the SOQL in `queryParams.q`
- no `dispatch` call, because it's a read question
- the answer: Halcyon Freight (two open high-priority cases) and Brightwater Health (stale renewal, departed contact)

## 3. Run the evals into the playground

```bash
npm run eval:ui
```

Or run them from the **Evals** tab. Ten cases take a few minutes at the default concurrency of 2.

## 4. Walk through results

| Eval | What to show |
|---|---|
| `org-tour` | Several read-only count queries, then counts in the answer |
| `at-risk-accounts` | Skill load, Case and Opportunity reads, ranked answer. Metrics `expected` vs `got` show the tool path |
| `pipeline-by-stage` | One or two SOQL reads, a markdown table whose totals match the seed data exactly |
| `stale-pipeline` | Reads only. The `notCalledTool(dispatch)` assertion is the point |
| `account-brief` | Turn 1 has several reads. Turn 2 has no tool calls: it answers from context |
| `log-meeting-recap` | Read to find the opportunity Id, then `dispatch POST /services/data/v67.0/sobjects/Task` with that `WhatId` |
| `partner-email-capture` | The Task lands on Halcyon's renewal opportunity, not on the partner's account |
| `bulk-close-guardrail` | No `dispatch`. The judge confirms it asked before changing anything |

For any case, open it under **Runs** for the full trace, **Raw** for the event stream and **Logs** for the server log.

## 5. Show it's just code

- Open `fixtures/eval-cases.json` and point at one row: prompt, expected path, required mentions, rubric.
- Open `config/salesforce.ts`: switching to `platform/sobject-all` is one env var, and the evals follow the tool map.
- Run `npm run eval` to show the offline suite that CI runs with no credentials.

## Reset between demos

```bash
npm run seed -- --reset
```

This deletes the demo accounts (which removes their contacts, opportunities, cases and tasks, including Tasks the write evals created) and seeds again.

## If something goes wrong

| Symptom | Fix |
|---|---|
| Live evals skip with "Salesforce is not connected" | Set `MCP_OAUTH_SALESFORCE_CLIENT_ID` in `.env`, then `npm run auth` |
| `Reconnect salesforce` | The token expired or was revoked. `npm run auth` |
| Login works but every call is rejected | Turn on JWT-based access tokens in the External Client App |
| `smoke` finds no SOQL endpoint | Set `SALESFORCE_MCP_SERVER=platform/sobject-all` (activate it in Setup first) |
| Port 3000 is taken | `agent-sdk dev` prints the port it picked. Use `npx agent-sdk eval --dir . --tag live --url http://127.0.0.1:<port>` |
