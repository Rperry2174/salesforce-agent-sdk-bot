# Demo runbook

A 10-minute walkthrough: the bot answers real questions from a Salesforce org, and the evals prove which MCP calls it made. Do the one-time setup in the [README](README.md#set-up-your-org-once) first.

## Before the demo

```bash
npm install
npm run auth        # skip if you authenticated recently
npm run smoke       # expect "ok" on every line and "demo data: seeded"
npm run seed        # only if smoke says the demo data isn't there (a few minutes: an agent seeds from fixtures/seed-prompt.md)
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
- every query scoped to the demo book of business (`Account.Site = 'sf-bot-demo'`)
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
| `pipeline-by-stage` | One or two SOQL reads on Opportunity. The table and totals are soft checks |
| `stale-pipeline` | Reads only. The `notCalledTool(dispatch)` assertion is the point |
| `account-brief` | Turn 1 has several reads. Turn 2 has no tool calls: it answers from context |
| `log-meeting-recap` | Read to find the opportunity Id, then `dispatch POST /services/data/v67.0/sobjects/Task` with that `WhatId` |
| `partner-email-capture` | The Task lands on Halcyon's renewal opportunity, not on the partner's account |
| `bulk-close-guardrail` | No `dispatch`: that's the gate. The judge score (soft) shows it asked before changing anything |

For any case, open it under **Runs** for the full trace, **Raw** for the event stream and **Logs** for the server log.

Every gate is a tool-call assertion: which tool, which sObject, GET versus POST, the `WhatId`, how many calls. Answer text and judge scores are soft, so they show up but never fail a case. Checking what Salesforce returned is Salesforce's side.

## 5. Show it's just code

- Open `fixtures/eval-cases.json` and point at one row: prompt, expected path, the sObjects it must touch (gates), and the soft mentions and rubric.
- Open `fixtures/seed-prompt.md`: the demo data is a prompt. `npm run seed -- --prompt your-story.md --dry-run` previews your own.
- Open `config/salesforce.ts`: switching to `platform/sobject-all` is one env var, and the evals follow the tool map.
- Run `npm run eval` to show the offline suite that CI runs with no credentials.

## Reset between demos

```bash
npm run seed -- --reset
```

This deletes the demo accounts (Site `sf-bot-demo`; Salesforce removes their contacts, opportunities, cases and tasks, including Tasks the write evals created) and seeds again. For an exact, model-free load use `npm run seed:fixtures -- --reset`.

## If something goes wrong

| Symptom | Fix |
|---|---|
| Live evals skip with "Salesforce is not connected" | Set `MCP_OAUTH_SALESFORCE_CLIENT_ID` in `.env`, then `npm run auth` |
| `Reconnect salesforce` | The token expired or was revoked. `npm run auth` |
| Login works but every call is rejected | Turn on JWT-based access tokens in the External Client App |
| `smoke` finds no SOQL endpoint | Set `SALESFORCE_MCP_SERVER=platform/sobject-all` (activate it in Setup first) |
| `[plan_required] Cloud Agent is not available` | The Cursor account behind `CURSOR_API_KEY` has no Cloud Agents plan. Remove the key and use `npx agent-sdk login` with a team account |
| Model turns exit with code 139 on a Mac | Node 22.13 crashes loading a native module. `nvm install 24 && nvm use` |
| Port 3000 is taken | `agent-sdk dev` prints the port it picked. Use `npx agent-sdk eval --dir . --tag live --url http://127.0.0.1:<port>` |
