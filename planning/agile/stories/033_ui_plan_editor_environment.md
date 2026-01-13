# Implement Plan Environment Settings UI

- **Status:** READY
- **Points:** 3
- **Story ID:** 033
- **Type:** Feature

## Description
Create the form for editing the environment of a plan.

## Mockup (Selected: Tabbed - Environment Tab)
```text
+-----------------------------------------------------------------------------+
|  EDIT PLAN: Market Analyzer V2                              [Save] [Cancel] |
+-----------------------------------------------------------------------------+
|  [ General ]   [ ENVIRONMENT ]   [ Roles ]   [ Workflow ]                   |
|  -------------------------------------------------------------------------  |
|                                                                             |
|  INITIAL VARIABLES                                                          |
|                                                                             |
|  KEY               TYPE            INITIAL VALUE             ACTIONS        |
|  -------------------------------------------------------------------------  |
|  money             [ Number v ]    [ 5000               ]    [ Del ]        |
|  market_status     [ String v ]    [ "OPEN"             ]    [ Del ]        |
|  symbols           [ Array  v ]    [ ["AAPL", "GOOG"]   ]    [ Del ]        |
|  [               ] [ String v ]    [                    ]                   |
|  (New Entry Row - Press Tab to add)                                         |
+-----------------------------------------------------------------------------+
```

## User Story
**As a** User,
**I want** to configure the starting state,
**So that** my experiment has the right inputs.

## Acceptance Criteria
- [ ] Environment Tab (Variables Table).
- [ ] **Feature**: Quick Entry Row for variables (No 'Add Button').
- [ ] **Feature**: Keyboard navigation (Tab) traverses row and creates new row at end.
- [ ] Switching tabs preserves unsaved state.
- [ ] Save button persists all tabs at once.

## Testing
1. Enter data in General.
2. Switch to Environment, add variable.
3. Switch back to General. Verify data remains.
4. Save. Verify database. plan.

## Review Log
