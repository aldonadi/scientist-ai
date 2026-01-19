# Tool Library and Editor Improvements Implementation Plan

## Goal
Improve the Tool Library and Editor by adding robust deletion with usage checks, adding a deletion button in the editor, fixing the persistence of the `endsTurn` property, and displaying usage information in the editor.

## Proposed Changes

### Backend

#### [MODIFY] [tool.schema.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/models/schemas/tool.schema.js)
- Add `endsTurn: z.boolean().optional()` to both `toolSchema` and `toolUpdateSchema` to allow persistence.

#### [MODIFY] [tool.controller.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/controllers/tool.controller.js)
- Implement `getToolUsage` handler.
    - Query `ExperimentPlan.find({ "roles.tools": id }).select('name roles')`.
    - Iterate to find which specific roles contain the tool ID.
    - Return structure: `[{ planId, planName, roleName }]`.
- Add route `GET /api/tools/:id/usage` in `tool.routes.js`.

#### [MODIFY] [tool.routes.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/routes/tool.routes.js)
- Register `getUsage` endpoint.

### Frontend

#### [MODIFY] [tool.service.ts](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/core/services/tool.service.ts)
- Add `getToolUsage(id: string): Observable<ToolUsage[]>` method.
- Update `CreateToolDto` interface to include optional `endsTurn`.

#### [MODIFY] [tool-list.component.ts](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/features/tools/tool-list.component.ts)
- Update `deleteTool`:
    - Call `toolService.getToolUsage(tool._id)`.
    - If usage exists, construct message listing plans.
    - Use `confirmService.confirm` with appropriate warning.
    - Proceed to delete if confirmed.

#### [MODIFY] [tool-editor.component.ts](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/features/tools/tool-editor.component.ts)
- **Delete Button**: Add to header next to Cancel/Save. Use same logic as List component (refactor logic to service or duplicate for now due to complexity of sharing).
- **Usage Display**:
    - Add `usage: ToolUsage[]` property.
    - Determine logic for "See all" modal (limit 10).
    - In template, add section to display links: `Plan Name (Role Name)`.
    - Add modal for full list.
- **Persistence**: Verify `save()` sends `endsTurn`.

## Verification Plan

### Automated Tests
- Run `npm run build` in frontend.

### Manual Verification
1.  **Ends Turn**: Edit a tool, toggle Ends Turn, Save. Refresh page to verify persistence.
2.  **Usage Display**:
    -   Create a Plan that uses a specific Tool.
    -   Go to Tool Editor for that tool.
    -   Verify the Plan/Role usage is displayed.
    -   Click link to ensure it navigates to Plan Editor > Role tab.
3.  **Deletion**:
    -   Try to delete the used tool from List. Verify warning mentions the plan.
    -   Try to delete from Editor. Verify same warning.
    -   Create unused tool. Delete it. Verify simple confirmation.
