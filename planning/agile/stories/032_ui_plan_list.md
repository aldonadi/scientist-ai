# Implement Plan List UI

- **Status:** READY
- **Points:** 2
- **Story ID:** 032
- **Type:** Feature

## Description
Create Plan List component.

## Mockup (Selected: Detailed Card)
```text
+-----------------------------------------------------------------------------+
|  EXPERIMENT PLANS                                       [ Create New Plan ] |
+-----------------------------------------------------------------------------+
|                                                                             |
|  +-----------------------------------------------------------------------+  |
|  |  MARKET ANALYZER V2                                     [Run] [Edit]  |  |
|  |  Analyzes SP500 using 3 specialized agents.             [Duplicate]   |  |
|  |                                                                       |  |
|  |  ROLES: [StockPicker] [NewsReader] [Analyst]                          |  |
|  |  LIMIT: 50 Steps         GOALS: 2 Defined                             |  |
|  |  -------------------------------------------------------------------  |  |
|  |  Last Run: Yesterday (Success)                                        |  |
|  +-----------------------------------------------------------------------+  |
|                                                                             |
|  +-----------------------------------------------------------------------+  |
|  |  DATA SCRAPER (SIMPLE)                                  [Run] [Edit]  |  |
|  |  Single agent loop to fetch URLs.                       [Duplicate]   |  |
|  |                                                                       |  |
|  |  ROLES: [Scraper]                                                     |  |
|  |  LIMIT: 10 Steps         GOALS: 1 Defined                             |  |
|  +-----------------------------------------------------------------------+  |
|                                                                             |
+-----------------------------------------------------------------------------+
```

## User Story
**As a** User,
**I want** to list plans,
**So that** I can find experiment templates.

## Acceptance Criteria
- [ ] Table view of plans.
- [ ] 'New Plan' button.

## Testing
1. Verify list rendering.

## Review Log
