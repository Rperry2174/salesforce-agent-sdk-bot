---
description: Use when you are unsure how to read or write a Salesforce record through discover, describe, dispatch_readonly and dispatch.
---

# Salesforce playbook (Headless 360)

## Read records

1. `discover({ "query": "run a SOQL query" })` once per conversation.
2. `dispatch_readonly({ "url": "/services/data/v67.0/query", "method": "GET", "queryParams": { "q": "<SOQL>" } })`.

SOQL hygiene: explicit fields, a `WHERE` or `ORDER BY`, `LIMIT 50`. Use relationship
fields (`Account.Name`) instead of a second query when you can.

Useful filters:

| Question | Filter |
| --- | --- |
| Open pipeline | `IsClosed = false` |
| Stale pipeline | `IsClosed = false AND (CloseDate < TODAY OR NextStep = null)` |
| Pipeline by stage | `SELECT StageName, SUM(Amount) total, COUNT(Id) n FROM Opportunity WHERE IsClosed = false GROUP BY StageName` |
| Open high-priority cases | `Priority = 'High' AND Status != 'Closed'` |
| Closing soon | `CloseDate = NEXT_N_DAYS:14` |

## Create an activity

1. Look up the record the activity belongs to and keep its `Id`.
2. `discover({ "query": "create a task" })`, then `describe` the operation it returns.
3. `dispatch({ "url": "/services/data/v67.0/sobjects/Task", "method": "POST", "body": { ... } })`

Body for a logged call: `Subject` ("Call: ..."), `WhatId`, `ActivityDate` (YYYY-MM-DD),
`Status: "Completed"`, `TaskSubtype: "Call"`, `Description`. A follow-up is a second Task
with `Status: "Not Started"` and the due date in `ActivityDate`.
