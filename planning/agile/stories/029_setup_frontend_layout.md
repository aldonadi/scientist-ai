# Setup Main Layout & Navigation

- **Status:** REVIEW
- **Points:** 3
- **Story ID:** 029
- **Type:** Feature

## Description
Create the main Angular shell with Sidebar and Header.

## Mockup (Selected: Standard Admin)
```text
+---------------------+-------------------------------------------------------+
|  SCIENTIST.AI (v1)  |  [Status: ONLINE]    [User: Admin]      [Settings]    |
+---------------------+-------------------------------------------------------+
|                     |                                                       |
|  [ Dashboard    ]   |  +----------------+  +----------------+  +---------+  |
|  [ Plans        ]   |  | Active Exp.    |  | System Health  |  | Queued  |  |
|  [ Tools        ]   |  |      3         |  |    98% OK      |  |    1    |  |
|  [ Experiments  ]   |  +----------------+  +----------------+  +---------+  |
|  [ Settings     ]   |                                                       |
|                     |  [ (+) Quick Start New Experiment ]                   |
|                     |                                                       |
|  -----------------  |  RECENT ACTIVITY -----------------------------------  |
|                     |                                                       |
|                     |  [Exp-102] "Market Reader" ... RUNNING  [View]        |
|                     |  [Exp-101] "Data Scraper"  ... PAUSED   [View]        |
|                     |  [Exp-099] "Test Run A"    ... COMPLETE [View]        |
|                     |                                                       |
|                     |                                                       |
+---------------------+-------------------------------------------------------+
| Copyright (c) 2026 Andrew Wilson, Scientist.AI           |   About   Help   |
+-----------------------------------------------------------------------------+
```

## User Story
**As a** User,
**I want** a navigation menu,
**So that** I can move between features.

## Acceptance Criteria
- [ ] Sidebar with links (Dashboard, Plans, Tools, etc).
- [ ] Header with app title.
- [ ] Responsive design.

## Testing
1. Click all links.
2. Verify routing works.

## Review Log
