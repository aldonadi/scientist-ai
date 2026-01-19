# UI Tweaks Implementation Plan

## Goal
Implement a set of UI improvements requested by the user to enhance usability in the Experiment Monitor, Script Editor, and Tools Library.

## User Review Required
> [!NOTE]
> Tool List filtering will use `localStorage` to persist the selected namespace between sessions/navigations.

## Proposed Changes

### Frontend

#### [MODIFY] [experiment-monitor.component.ts](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/features/experiments/experiment-monitor.component.ts)
- **Polling Interval**: Change `setInterval` delay from `1000` to `2000` ms.
- **System Prompt UI**:
    - Update template to use `line-clamp-4` for System Prompts by default.
    - Add a "Expand/Collapse" toggle button (icon) if content exceeds threshold (checking `msg.content.length` or line count).
    - Use a simple set `expandedMessages: Set<number>` to track expansion state.

#### [MODIFY] [scripts-tab.component.ts](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/features/plans/plan-editor/scripts-tab.component.ts)
- **Script Textbox**: Increase `rows` attribute to `40` to accommodate larger scripts (approx 50 lines visible with scrolling if needed).

#### [MODIFY] [tool-list.component.ts](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/features/tools/tool-list.component.ts)
- **Pagination**: Change `pageSize` default from `10` to `50`.
- **Filter Persistence**:
    - In `ngOnInit`, check `localStorage.getItem('toolList_namespace')` and set `selectedNamespace`.
    - In `filterTools`, update `localStorage.setItem('toolList_namespace', this.selectedNamespace)`.

## Verification Plan

### Automated Tests
- Run `npm run build` in frontend to ensure no template errors.

### Manual Verification
- **Monitor**: Verify updates happen every 2s. Check System Prompt expansion behavior (long vs short prompts).
- **Scripts**: Check script editor height is sufficient.
- **Tools**:
    - Set namespace filter A.
    - Edit a tool.
    - Save/Back.
    - Verify filter A is still selected.
    - Check pagination shows up to 50 items.
