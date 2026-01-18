# Implement Plan Role Editor UI

- **Status:** REVIEW
- **Points:** 5
- **Story ID:** 034
- **Type:** Feature

## Description
Create a complex form component for adding/editing Roles within a Plan.

## Mockup (Selected: Reorderable Roles)
```text
+-----------------------------------------------------------------------------+
|  EDIT PLAN: Market Analyzer V2                              [Save] [Cancel] |
+-----------------------------------------------------------------------------+
|  [ General ]   [ Environment ]   [ ROLES ]   [ Workflow ]                   |
|  -------------------------------------------------------------------------  |
|                                                                             |
|  AGENTS (Will be run in the order listed)               [ (+) Add Role ]    |
|                                                                             |
|      #   ROLE NAME       MODEL       TOOLS    ACTIONS                       |
|  -------------------------------------------------------------------------  |
|  ::  1   StockPicker     GPT-4       2        [Edit] [Del]                  |
|  ::  2   NewsReader      Claude-3    1        [Edit] [Del]                  |
|  ::  3   Analyst         Llama-3     5        [Edit] [Del]                  |
|                                                                             |
|  -------------------------------------------------------------------------  |
|  ( v ) EDITING: StockPicker                                                 |
|                                                                             |
|  System Prompt:                                                             |
|  [ You are an expert stock picker...                                      ] |
|                                                                             |
|  Model: [ GPT-4-Turbo v ]                                                   |
|                                                                             |
|  Selected Tools:                                                            |
|  [ finance_v1/get_quote (x)]  [ utils/web_scraper (x) ]                     |
|  [ Search tools...                                      ]                   |
|                                                                             |
+-----------------------------------------------------------------------------+
```

## User Story
**As a** User,
**I want** to define roles,
**So that** I can assign agents to the experiment.

## Acceptance Criteria
- [ ] Add/Remove Role.
- [ ] Edit System Prompt.
- [ ] **Feature**: Tools Multi-select using "Chips" UI with removal 'x'.
- [ ] **Feature**: Tool search autocomplete for adding new chips.
- [ ] **Feature**: Tooltips on chips show description.
- [ ] **Feature**: Tool names link to Tool Editor (preserving unsaved state).
- [ ] **Feature**: Roles are ordered. Header says "Will be run in the order listed".
- [ ] **Feature**: Drag-and-drop reordering of Role rows.

## Testing
1. Add a role.
2. Save.
3. Verify integrity.

## Review Log
