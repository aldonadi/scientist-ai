# Implement Plan General Settings UI

- **Status:** NOT READY
- **Points:** 3
- **Story ID:** 057
- **Type:** Feature

## Description
Create the form## Mockup (Selected: Tabbed - General Tab)
```text
+-----------------------------------------------------------------------------+
|  EDIT PLAN: Market Analyzer V2                              [Save] [Cancel] |
+-----------------------------------------------------------------------------+
|  [ GENERAL ]   [ Environment ]   [ Roles ]   [ Workflow ]                   |
|  -------------------------------------------------------------------------  |
|                                                                             |
|  Plan Name:                                                                 |
|  [ Market Analyzer V2                                                     ] |
|                                                                             |
|  Description:                                                               |
|  [ Analyzes the S&P 500 by delegating to sub-agents.                      ] |
|  [                                                                        ] |
|                                                                             |
|  Safety Limits:                                                             |
|  Max Steps: [ 50  ] (Default: 20)                                           |
|                                                                             |
+-----------------------------------------------------------------------------+
```

## User Story
**As a** User,
**I want** set a custom name, a detailed description, and the maximum number of allowed steps for the plan,
**So that** I can easily recognize the plan and maintain control over its execution.

## Acceptance Criteria
- [ ] General Info Tab (Name, Desc, MaxSteps).
- [ ] Switching tabs preserves unsaved state.
- [ ] Save button persists all tabs at once.

## Testing
1. Enter data in General.
2. Switch to another tab.
3. Switch back to General. Verify data remains.
4. Save. Verify database. plan.

## Review Log
