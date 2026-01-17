# Fix Input Focus Loss in Plan Editor Tabs

The user reported that typing in the Goal condition input causes focus loss after every character. This is caused by Angular destroying and recreating the DOM elements upon every keystroke because the parent component emits a new array reference, triggering a full list re-render in `*ngFor`. The same issue affects the Scripts tab.

## User Review Required
No breaking changes. This is a frontend performance/UX fix.

## Proposed Changes

### Frontend Components
#### [MODIFY] [goals-tab.component.ts](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/features/plans/plan-editor/goals-tab.component.ts)
- Add `trackByIndex(index: number): number { return index; }` method.
- Update `*ngFor="let goal of goalsWithErrors"` to include `; trackBy: trackByIndex`.

#### [MODIFY] [scripts-tab.component.ts](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/features/plans/plan-editor/scripts-tab.component.ts)
- Add `trackByIndex(index: number): number { return index; }` method.
- Update `*ngFor="let script of getEventScripts()"` to include `; trackBy: trackByIndex`.

## Verification Plan

### Browser Test
Run a browser subagent task:
1. Navigate to `/plans/696afdf7f8822c5ed7cbb782` (BlackJack).
2. Go to **Goals Tab**.
3. Create a new Goal.
4. Type "Test" in condition.
   - **Check**: Does focus remain in the input for all 4 characters?
5. Go to **Scripts Tab**.
6. Create a new Script.
7. Type in Code.
   - **Check**: Does focus remain?
