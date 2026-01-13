# Implementation Plan - Frontend Epic

**Goal**: Build the core UI for Scientist.ai, enabling users to manage Tools and Experiment Plans.

## User Review Required
> [!IMPORTANT]
> This plan covers a significant amount of UI work across multiple stories (029-034).
> We will implement this iteratively, starting with the Layout and Dashboard.

- **Dependencies**: Requires `npm install` for Angular dependencies (already present).
- **New Libraries**: We may need to install `ngx-monaco-editor` or similar for the code editor features.

## Proposed Changes

### 1. Foundation & Layout (Story 029)
#### [NEW] [frontend/src/app/core/layout/](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/core/layout/)
- `layout.component.ts`: Main shell with Sidebar and Header.
- `sidebar.component.ts`: Navigation links.
- `header.component.ts`: App title and global actions.

#### [NEW] [frontend/src/app/features/dashboard/](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/features/dashboard/)
- `dashboard.component.ts`: "Standard Admin" layout with metrics and recent activity table.

### 2. Tools Management (Stories 030, 031)
#### [NEW] [frontend/src/app/core/services/tool.service.ts](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/core/services/tool.service.ts)
- Methods: `getTools()`, `getTool(id)`, `createTool()`, `updateTool()`, `deleteTool()`.

#### [NEW] [frontend/src/app/features/tools/](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/features/tools/)
- `tool-list.component.ts`: Data table with "Source Preview" tooltip.
- `tool-editor.component.ts`: Split-pane editor (Metadata + Code).
    - Includes auto-generation of JSON schema from Python mock logic.

### 3. Plans Management (Stories 032, 033, 034)
#### [NEW] [frontend/src/app/core/services/plan.service.ts](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/core/services/plan.service.ts)
- Methods: `getPlans()`, `getPlan(id)`, `savePlan()`, `duplicatePlan()`.

#### [NEW] [frontend/src/app/features/plans/](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/features/plans/)
- `plan-list.component.ts`: Detailed Blueprint Cards layout.
- `plan-editor/`:
    - `plan-editor.component.ts`: Tab container (state preservation).
    - `general-tab.component.ts`: Metadata form.
    - `environment-tab.component.ts`: Variables table with Quick Entry row.
    - `roles-tab.component.ts`: Reorderable list with "Chip" tool selection.
    - `workflow-tab.component.ts`: Split-pane Hooks Editor (Story 056).
        - Left: Lifecycle Event List (with active counts).
        - Right: Reorderable Script Editors (Code + Policies).

## Verification Plan

### Automated Tests
- **Unit Tests**: Run `ng test` to verify component rendering and service logic.
    - Verify `ToolService` and `PlanService` API calls.
    - Verify Form validations in Editors.

### Manual Verification
1.  **Layout**: Run `ng serve`, navigate to `http://localhost:4200`. check Sidebar/Header.
2.  **Tools**:
    - Create a new tool.
    - Check the "Source Preview" tooltip in the list.
    - Verify JSON schema auto-generation in the editor.
3.  **Plans**:
    - Create a plan.
    - Test Quick Entry in Environment tab.
    - Test Drag-and-Drop ordering in Roles tab.
    - Verify switching tabs does not lose unsaved data.
