# Plan Editor UI Refactor Walkthrough

I have completed the UI refactor for the Plan Editor. Here is a summary of the changes:

## Changes

### 1. Goals Tab (formerly Workflow Tab)
- **Renamed** the "Workflow" tab to "**Goals**".
- **Moved** all script/lifecycle event logic to a new "Scripts" tab (see below).
- **Updated** the "Add Goal" action from a simple link to a **button** that matches the style of the "Add Role" button on the Roles tab.

### 2. Scripts Tab (New)
- **Created** a new "**Scripts**" tab dedicated to Lifecycle Events.
- **Moved** the hook list and script editor from the old Workflow tab to this new tab.
- **Updated** the Hook List formatting:
  - Hooks with scripts now display as `HOOK_NAME (N scripts)` (e.g., `STEP_START (1 script)`).
  - Hooks with no scripts display just the name (e.g., `EXPERIMENT_START`), preserving the original clean look.

### 3. Code Structure
- **Created** `goals-tab.component.ts`: Handles the Goals section.
- **Created** `scripts-tab.component.ts`: Handles lifecycle hooks and scripts.
- **Updated** `plan-editor.component.ts`: Integrates the new tabs and removes the old `WorkflowTabComponent`.
- **Deleted** `workflow-tab.component.ts`: No longer needed.

## Verification
I have verified the file structure and code changes. The new components correctly implement the requested UI logic and styles.

### Files Created/Modified
- `src/app/features/plans/plan-editor/goals-tab.component.ts` [NEW]
- `src/app/features/plans/plan-editor/scripts-tab.component.ts` [NEW]
- `src/app/features/plans/plan-editor/plan-editor.component.ts` [MODIFIED]
- `src/app/features/plans/plan-editor/workflow-tab.component.ts` [DELETED]
