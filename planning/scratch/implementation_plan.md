# Plan Editor UI Refactor

## Goal Description
Refactor the Plan Editor UI to improve usability and consistency. This involves splitting the "Workflow" tab into distinct "Goals" and "Scripts" tabs, matching button styles for consistency, and improving the readability of the Lifecycle Events list.

## Proposed Changes

### Frontend Components (`src/app/features/plans/plan-editor/`)

#### [NEW] `goals-tab.component.ts`
- Create a new component `GoalsTabComponent` based on the Goals section of existing `WorkflowTabComponent`.
- **UI Change**: Replace "Add Goal" link with a button styled like "Add Role".
- **Selector**: `app-goals-tab`

#### [NEW] `scripts-tab.component.ts`
- Create a new component `ScriptsTabComponent` based on the Scripts/Lifecycle section of existing `WorkflowTabComponent`.
- **UI Change**: Update hook list formatting to `HOOK_NAME ($num_scripts)` when scripts exist.
- **Selector**: `app-scripts-tab`

#### [MODIFY] `plan-editor.component.ts`
- Remove `WorkflowTabComponent`.
- Import `GoalsTabComponent` and `ScriptsTabComponent`.
- Update `tabs` configuration:
    - Rename "Workflow" to "Goals".
    - Add "Scripts".
- Update template to render new components.

#### [DELETE] `workflow-tab.component.ts`
- Remove this file as it is being replaced by `goals-tab` and `scripts-tab`.

## Verification Plan

### Automated Tests
- Run existing tests to ensure no regressions (though UI tests might fail if they exist).
- Run `npm test` (if available) or check for spec files. I noticed `index.ts` in the directory, but no `.spec.ts` files were listed in `plan-editor` folder. I should check parent folders for integration tests.

### Manual Verification
1.  **Goals Tab**:
    - Verify "Workflow" tab is now "Goals".
    - Check "Add Goal" is now a blue button.
    - Verify adding/removing goals works.
2.  **Scripts Tab**:
    - Verify new "Scripts" tab exists.
    - Check Lifecycle Events list.
    - Verify formatting: `HOOK_NAME (n)` for active hooks.
    - Verify adding/removing scripts works.
3.  **General**:
    - Ensure saving the plan still works with the new structure.
