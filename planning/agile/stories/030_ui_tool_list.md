# Implement Tool List UI

- **Status:** REVIEW
- **Points:** 2
- **Story ID:** 030
- **Type:** Feature

## Description
Create the Tool List component.

## Mockup (Selected: Data Table with Source Preview)

### List of tools
```text
+-----------------------------------------------------------------------------+
|  TOOLS LIBRARY                                          [ (+) Create Tool ] |
+-----------------------------------------------------------------------------+
|                                                                             |
|  [ Search tools...           Q ]   Filter: [All Namespaces v]               |
|                                                                             |
|  NAME              NAMESPACE       UPDATED       ACTIONS                    |
|  -------------------------------------------------------------------------  |
|  stock_analyzer    finance_v1      2 mins ago    [Edit] [Del]               |
|  web_scraper       utils           1 hour ago    [Edit] [Del]               |
|  summarizer        nlp_core        Yesterday     [Edit] [Del]               |
|  send_email        notification    Oct 22        [Edit] [Del]               |
|  calc_metrics      finance_v1      Oct 20        [Edit] [Del]               |
|                                                                             |
|  <  1  2  3  >   Showing 1-10 of 42                                         |
+-----------------------------------------------------------------------------+
```

### List of tools (user hovering mouse over a tool name)
```text
+-----------------------------------------------------------------------------+
|  TOOLS LIBRARY                                          [ (+) Create Tool ] |
+-----------------------------------------------------------------------------+
|                                                                             |
|  [ Search tools...           Q ]   Filter: [All Namespaces v]               |
|                                                                             |
|  NAME              NAMESPACE       UPDATED       ACTIONS                    |
|  -------------------------------------------------------------------------  |
|  stock_analyzer    finance_v1      2 mins ago    [Edit] [Del]               |
|      / \                                                                    |
|     /   \--[PREVIEW]-------------------------------------------------------\|
|    |    def execute(env, args):                                             |
|    |        """Fetches OHLC data..."""                                      |
|    |        ticker = args.get('ticker')                                     |
|    |        if not ticker:                                                  |
|    |             return "Error: No ticker"                                  |
|    |        # ... (more)                                                    |
|     \______________________________________________________________________/|
|                                                                             |
|  web_scraper       utils           1 hour ago    [Edit] [Del]               |
|  summarizer        nlp_core        Yesterday     [Edit] [Del]               |
|                                                                             |
|  <  1  2  3  >   Showing 1-10 of 42                                         |
+-----------------------------------------------------------------------------+
```

## User Story
**As a** User,
**I want** to see my tools,
**So that** I can manage them.

## Acceptance Criteria
- [ ] Fetches tools from API.
- [ ] Displays in table (Name, Namespace, Updated, Actions).
- [ ] Filter by namespace.
- [ ] **Feature**: Hovering over tool name shows a tooltip with the first 7 lines of source code.

## Testing
1. Load page.
2. Verify list matches DB.

## Review Log
