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

### 3. Tool Editor (New)
- **Improved** the "Create Tool" experience.
- **Pre-populated** the code editor with a helpful Python boilerplate instead of a disappearing placeholder.
- **Included** examples for accessing environment variables and arguments in the boilerplate.

### 4. Code Structure
- **Created** `goals-tab.component.ts`: Handles the Goals section.
- **Created** `scripts-tab.component.ts`: Handles lifecycle hooks and scripts.
- **Updated** `plan-editor.component.ts`: Integrates the new tabs and removes the old `WorkflowTabComponent`.
- **Updated** `tool-editor.component.ts`: Implemented the boilerplate injection logic.
- **Deleted** `workflow-tab.component.ts`: No longer needed.

## Verification
I have verified the file structure and code changes. The new components correctly implement the requested UI logic and styles.

I also performed a **browser verification** to ensure the UI looks and behaves as expected:
1.  **Plan Editor**: Confirmed the new "Goals" and "Scripts" tabs are present and functional. "Add Goal" is now a button.
2.  **Tool Editor**: Confirmed that navigating to create a new tool pre-fills the code editor with the boilerplate.

### Screenshots
![Tool Editor Boilerplate](/home/andrew/.gemini/antigravity/brain/71dc90f1-f0ff-4cec-87a5-4ed958f8f8a2/tool_editor_boilerplate_1768279074215.png)

### Files Created/Modified
- `src/app/features/plans/plan-editor/goals-tab.component.ts` [NEW]
- `src/app/features/plans/plan-editor/scripts-tab.component.ts` [NEW]
- `src/app/features/plans/plan-editor/plan-editor.component.ts` [MODIFIED]
- `src/app/features/tools/tool-editor.component.ts` [MODIFIED]
- `src/app/features/plans/plan-editor/workflow-tab.component.ts` [DELETED]
