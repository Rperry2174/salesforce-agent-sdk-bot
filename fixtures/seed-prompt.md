# Seed prompt: fictional B2B sales org

<!-- npm run seed sends this file to the seeding agent (seeder/). Swap in your own with
     `npm run seed -- --prompt <file>` or SEED_PROMPT_FILE. Plain English works; tables are optional. -->

Create a small, fictional book of business for a B2B software company: 8 accounts with 16 contacts,
12 opportunities, 8 support cases and 10 logged activities (Tasks). Every company is invented, and
every email address and website uses the `example.com` domain. Phone numbers use 555-01xx.

The live evals ask about this data, so keep every name, amount, stage, priority, status and date exactly as written.
Dates are relative to the day you seed (`today-21d` is 21 days ago).

## Accounts

| Account | Industry | Type | Website | Phone | Description |
| --- | --- | --- | --- | --- | --- |
| Halcyon Freight Co. | Transportation | Customer - Direct | https://www.halcyonfreight.example.com | 555-0110 | Freight and logistics customer. Partner of record: Orbital Systems Integrators. |
| Brightwater Health Partners | Healthcare | Customer - Direct | https://www.brightwaterhealth.example.com | 555-0111 | Regional healthcare network. Executive champion left in the last quarter. |
| Juniper Ridge Outfitters | Retail | Customer - Direct | https://www.juniperridge.example.com | 555-0112 | Outdoor retail chain. Expanding seat count. |
| Tessellate Robotics | Manufacturing | Prospect | https://www.tessellate.example.com | 555-0113 | Industrial robotics prospect in an active pilot. |
| Marlowe & Finch Insurance | Insurance | Customer - Direct | https://www.marlowefinch.example.com | 555-0114 | Specialty insurer. |
| Quillfeather Analytics | Technology | Prospect | https://www.quillfeather.example.com | 555-0115 | Analytics startup evaluating an add-on. |
| Orbital Systems Integrators | Technology | Channel Partner / Reseller | https://www.orbital-si.example.com | 555-0116 | Reseller partner. Resells to Halcyon Freight Co. |
| Cobalt Mesa Energy | Energy | Customer - Direct | https://www.cobaltmesa.example.com | 555-0117 | Energy customer. Healthy, expanding in phases. |

## Contacts

| Account | First name | Last name | Title | Email | Description |
| --- | --- | --- | --- | --- | --- |
| Halcyon Freight Co. | Priya | Natarajan | VP Operations | priya.natarajan@halcyonfreight.example.com | Executive sponsor for the FY27 renewal. |
| Halcyon Freight Co. | Marcus | Albright | IT Director | marcus.albright@halcyonfreight.example.com | Owns the tracking API integration. |
| Brightwater Health Partners | Dana | Okafor | Former CIO (left the company) | dana.okafor@brightwaterhealth.example.com | Was our champion. Left Brightwater last quarter; no replacement sponsor yet. |
| Brightwater Health Partners | Elena | Voss | Procurement Manager | elena.voss@brightwaterhealth.example.com | Handles the renewal paperwork. |
| Juniper Ridge Outfitters | Sam | Whitaker | Head of Store Operations | sam.whitaker@juniperridge.example.com | Ops lead driving the seat expansion. |
| Juniper Ridge Outfitters | Rosa | Delgado | CFO | rosa.delgado@juniperridge.example.com | Approves the expansion budget. |
| Tessellate Robotics | Kenji | Mori | CTO | kenji.mori@tessellate.example.com | Technical owner of the pilot. |
| Tessellate Robotics | Aisha | Bello | Head of Procurement | aisha.bello@tessellate.example.com | Runs vendor selection. |
| Marlowe & Finch Insurance | Owen | Hartley | Director of Claims | owen.hartley@marlowefinch.example.com | Sponsor for claims automation. |
| Marlowe & Finch Insurance | Grace | Lindqvist | IT Program Manager | grace.lindqvist@marlowefinch.example.com | Day-to-day contact. |
| Quillfeather Analytics | Noah | Fairbanks | Founder and CEO | noah.fairbanks@quillfeather.example.com | Decision maker. |
| Quillfeather Analytics | Mia | Castellanos | Data Lead | mia.castellanos@quillfeather.example.com | Evaluating the add-on. |
| Orbital Systems Integrators | Leo | Brandt | Partner Manager | leo.brandt@orbital-si.example.com | Our partner manager at Orbital. |
| Orbital Systems Integrators | Ines | Carvalho | Solutions Architect | ines.carvalho@orbital-si.example.com | Partner technical lead. |
| Cobalt Mesa Energy | Hannah | Reyes | VP Digital | hannah.reyes@cobaltmesa.example.com | Sponsor for Phase 2 and Phase 3. |
| Cobalt Mesa Energy | Theo | Nakamura | Platform Engineer | theo.nakamura@cobaltmesa.example.com | Technical contact. |

## Opportunities

| Account | Opportunity name | Amount | Stage | Close date | Next step | Forecast category | Description |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Halcyon Freight Co. | Halcyon Freight - FY27 Renewal | 240000 | Negotiation/Review | today+45d | Send 3-year pricing option |  | Close date has moved twice this year. Partner: Orbital Systems Integrators. |
| Halcyon Freight Co. | Halcyon Freight - Tracking API Add-on | 35000 | Needs Analysis | today+75d | Scope the add-on after the 502s are fixed |  |  |
| Brightwater Health Partners | Brightwater Health - Platform Renewal | 180000 | Negotiation/Review | today+30d | Find a new executive sponsor | Commit | Forecast: Commit. No logged activity since the champion left. |
| Juniper Ridge Outfitters | Juniper Ridge - Expansion | 95000 | Proposal/Price Quote | today+20d | Send pricing for additional seats |  |  |
| Juniper Ridge Outfitters | Juniper Ridge - Loyalty Integration | 25000 | Qualification | today+60d | Book discovery call |  |  |
| Tessellate Robotics | Tessellate Robotics - New Logo Pilot | 60000 | Qualification | today+10d | Confirm pilot success criteria |  | Closing this month. |
| Marlowe & Finch Insurance | Marlowe & Finch - Claims Automation | 120000 | Proposal/Price Quote | today-21d | Follow up on proposal |  | Close date passed without an update. |
| Quillfeather Analytics | Quillfeather - Analytics Add-on | 40000 | Needs Analysis | today-9d | (none, leave empty) |  | No next step recorded. |
| Quillfeather Analytics | Quillfeather - Platform Trial | 30000 | Prospecting | today+40d | Send trial welcome kit |  |  |
| Cobalt Mesa Energy | Cobalt Mesa - Phase 2 | 150000 | Closed Won | today-70d | (none, leave empty) |  | Closed last quarter. |
| Cobalt Mesa Energy | Cobalt Mesa - Phase 3 | 110000 | Value Proposition | today+50d | Share data residency answer |  |  |
| Orbital Systems Integrators | Orbital Systems - Partner Enablement | 15000 | Closed Lost | today-100d | (none, leave empty) |  | Partner chose to self-train. |

## Cases

| Account | Subject | Priority | Status | Origin |
| --- | --- | --- | --- | --- |
| Halcyon Freight Co. | Shipment tracking API returning 502s | High | Escalated | Web |
| Halcyon Freight Co. | Invoice totals mismatched with quote | High | New | Web |
| Juniper Ridge Outfitters | SSO login loop after password reset | High | Closed | Web |
| Juniper Ridge Outfitters | Request to export loyalty data | Low | Closed | Web |
| Tessellate Robotics | Sandbox provisioning delayed | Medium | Working | Web |
| Brightwater Health Partners | Scheduled report not sending | Low | New | Web |
| Marlowe & Finch Insurance | Claims dashboard slow to load | Medium | Working | Web |
| Cobalt Mesa Energy | Question about Phase 3 data residency | Medium | Closed | Web |

## Activities (Tasks on the account)

| Account | Subject | Date | Status | Priority | Type (TaskSubtype) |
| --- | --- | --- | --- | --- | --- |
| Halcyon Freight Co. | Call with Priya about renewal timeline | today-3d | Completed | Normal | Call |
| Halcyon Freight Co. | Emailed Marcus the 502 incident summary | today-5d | Completed | Normal | Email |
| Juniper Ridge Outfitters | Expansion pricing walkthrough | today-2d | Completed | Normal | Call |
| Juniper Ridge Outfitters | Sent seat calculator | today-6d | Completed | Normal | Email |
| Tessellate Robotics | Pilot kickoff call | today-1d | Completed | Normal | Call |
| Marlowe & Finch Insurance | Proposal sent to Owen | today-30d | Completed | Normal | Email |
| Quillfeather Analytics | Intro call with Noah | today-12d | Completed | Normal | Call |
| Orbital Systems Integrators | Partner pipeline sync with Leo | today-4d | Completed | Normal | Call |
| Cobalt Mesa Energy | Phase 3 scoping call | today-5d | Completed | Normal | Call |
| Cobalt Mesa Energy | Shared data residency FAQ | today-8d | Completed | Normal | Email |

## The story the evals look for

- Halcyon Freight and Brightwater Health are at risk: Halcyon has two open High-priority cases, and Brightwater's renewal has no recent activity and its champion left.
- Marlowe & Finch's Claims Automation is past its close date, and Quillfeather's Analytics Add-on has no next step: both are stale.
- Orbital Systems Integrators is a partner, not a customer. Its contact Leo Brandt sends emails about Halcyon's renewal.
