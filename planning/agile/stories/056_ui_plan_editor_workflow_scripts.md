# Implement Plan Editor Scripts & Hooks UI

- **Status:** READY
- **Points:** 5
- **Story ID:** 056
- **Type:** Feature

## Description
Create a dedicated editor component for configuring experiment lifecycle hooks and custom scripts within the Plan Editor.

## Mockup (Selected: Refined Lifecycle)
```text
+-----------------------------------------------------------------------------+
|  EDIT PLAN: Market Analyzer V2                              [Save] [Cancel] |
+-----------------------------------------------------------------------------+
|  [ General ]   [ Environment ]   [ Roles ]   [ WORKFLOW ]                   |
|  -------------------------------------------------------------------------  |
|                                                                             |
|  LIFECYCLE EVENTS (Ordered)      |  HOOK: STEP_START                        |
|                                  |  These scripts run before every step.    |
|                                  |                                          |
|  EXPERIMENT_START                |  SCRIPTS (Run in order)                  |
|                                  |                                          |
|  **STEP_START (1 script)**       |  1. [ CheckBudget                      ] |
|                                  |     Mode: [Sync v]  Fail: [Abort v]      |
|  ROLE_START (2 scripts)          |     Code:                                |
|                                  |     +----------------------------------+ |
|  MODEL_PROMPT                    |     | def run(context):                | |
|                                  |     |   if context.env.money < 0:      | |
|  MODEL_RESPONSE_CHUNK            |     |      return False                | |
|                                  |     +----------------------------------+ |
|                                  |                                          |
|                                  | [ (+) Add Script ]                       |
+----------------------------------+------------------------------------------+
```

## User Story
**As a** Power User,
**I want** to attach scripts to experiment events,
**So that** I can customize execution logic (e.g. logging, validation, dynamic termination).

## Acceptance Criteria
- [ ] **UI Layout**: Split pane (Left: Events, Right: Scripts).
- [ ] **Event List**: Shows all lifecycle events in execution order.
- [ ] **Active Indicator**: Bold text + Count for events with attached scripts (e.g. "**STEP_START (2 scripts)**").
- [ ] **Script Management**: Ability to add multiple scripts to a single event.
- [ ] **Reordering**: Ability to reorder scripts within an event by clicking and dragging.
- [ ] **Configuration**: Each script has:
    - Code Editor (Pre-filled with `def run(context):`).
    - Execution Mode (Sync/Async).
    - Fail Policy (Abort Experiment / Continue with Error).
- [ ] **Integration**: This UI is the content of the "Workflow" tab in the Plan Editor.

## Review Log
