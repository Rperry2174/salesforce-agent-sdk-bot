---
description: Use before deciding which accounts are at risk. Defines at-risk in this org and the queries that prove it.
---

# At-risk rubric

A customer account is **at risk** when at least one of these is true:

1. It has **two or more open High-priority cases** (`Priority = 'High' AND Status != 'Closed'`).
2. It has an **open renewal opportunity** (name contains "Renewal", stage not Closed) and
   **no logged activity in the last 30 days** (`LastActivityDate` older than 30 days, or empty).
3. A key contact **left the company** (their `Title` says so).

Prospects and partners are never "at risk"; they have no contract to lose.

## Queries

Run these with `dispatch_readonly` (one call each):

```sql
SELECT Account.Name, Subject, Priority, Status FROM Case
WHERE Priority = 'High' AND Status != 'Closed' LIMIT 50

SELECT Name, Account.Name, StageName, Amount, CloseDate, Account.LastActivityDate FROM Opportunity
WHERE IsClosed = false AND Name LIKE '%Renewal%' LIMIT 50

SELECT Name, Title, Account.Name FROM Contact
WHERE Title LIKE '%left%' LIMIT 50
```

## Answer

Rank at-risk accounts by how many rules they hit, then by renewal amount. Give one
concrete reason per rule hit. List only accounts that hit a rule; don't list healthy ones.
