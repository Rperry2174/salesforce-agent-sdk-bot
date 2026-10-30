---
description: Use when you are unsure how to read or write a Salesforce record through discover, describe, dispatch_readonly and dispatch.
---

# Salesforce playbook (Headless 360)

## Read records

1. `discover({ "query": "run a SOQL query" })` once per conversation.
2. `dispatch_readonly({ "url": "/services/data/v67.0/query", "method": "GET", "queryParams": { "q": "<SOQL>" } })`.

SOQL hygiene: explicit fields, a `WHERE` or `ORDER BY`, `LIMIT 50`. Aggregate queries
(`COUNT(Id)`, `SUM(Amount)` without `GROUP BY`) reject `LIMIT`, so leave it off those. Use relationship
fields (`Account.Name`) instead of a second query when you can.

Scope every query to the demo book of business: `Site = 'sf-bot-demo'` on Account,
`Account.Site = 'sf-bot-demo'` on Contact, Opportunity, Case and Task.

Useful filters (add them after the scope):

| Question | Filter |
| --- | --- |
| Open pipeline | `IsClosed = false` |
| Stale pipeline | `IsClosed = false AND (CloseDate < TODAY OR NextStep = null)` |
| Pipeline by stage | `SELECT StageName, SUM(Amount) total, COUNT(Id) n FROM Opportunity WHERE Account.Site = 'sf-bot-demo' AND IsClosed = false GROUP BY StageName` |
| Open high-priority cases | `Priority = 'High' AND Status != 'Closed'` |
| Closing soon | `CloseDate = NEXT_N_DAYS:14` |

## Create an activity

1. Look up the record the activity belongs to and keep its `Id`.
2. `discover({ "query": "create a task" })`, then `describe` the operation it returns.
3. `dispatch({ "url": "/services/data/v67.0/sobjects/Task", "method": "POST", "body": { ... } })`

Body for a logged call: `Subject: "Call"`, `WhatId`, `ActivityDate` (YYYY-MM-DD),
`Status: "Completed"`, `TaskSubtype: "Call"`, `Priority: "Normal"`, `OwnerId`, and the
details in `Description`. A logged email is the same with `Subject: "Email"` and
`TaskSubtype: "Email"`. A follow-up is a second Task with `Status: "Not Started"`, the due
date in `ActivityDate`, and a `Subject` such as `"Send Quote"`, `"Send Letter"` or `"Other"`.

Org rules that reject a Task with a 400 if you miss them:

- `Subject` is a restricted picklist. Use one of its values (`Call`, `Email`, `Send Quote`,
  `Send Letter`, `Other`), never free text. Put the summary in `Description`. If unsure, read
  the values: `SELECT Value FROM PicklistValueInfo WHERE EntityParticle.EntityDefinition.QualifiedApiName = 'Task' AND EntityParticle.QualifiedApiName = 'Subject' AND IsActive = true LIMIT 50`.
- `OwnerId` and `Priority` are required. Get your own user Id once with
  `dispatch_readonly({ "url": "/services/data/v67.0/chatter/users/me", "method": "GET" })` (its `id`).
