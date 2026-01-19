# UI Polish & Stability Fixes

## Goal Description
Improve usability of the Experiment Monitor by fixing polling-induced state resets (lost text selection, closed headers) and providing ways to view truncated data in the Environment and State History views.

## User Review Required
None.

## Proposed Changes

### Frontend
#### [experiment-monitor.component.ts](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/features/experiments/experiment-monitor.component.ts)
- Add `trackBy` function to Chat History `*ngFor` loop to prevent DOM destruction during polling.

#### [log-feed.component.ts](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/features/experiments/log-feed.component.ts)
- Add `trackBy` function to `*ngFor` loop for logs.

#### [state-history.component.ts](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/features/experiments/state-history.component.ts)
- Add `trackBy` function to table rows.
- Implement a modal dialog template for viewing full cell content.
- Add `(dblclick)` handler to table cells to open the modal.

#### [json-tree.component.ts](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/features/experiments/json-tree.component.ts)
- Add click handler to truncated strings to open a modal with full content.

## Verification Plan
### Manual Verification
- **Chat History**: Select text in chat, wait for poll (5s+), verify selection remains. Expand "Thinking Process", wait for poll, verify it stays open.
- **Log Feed**: Select log text, wait for poll, verify selection remains.
- **State History**: Double click a cell, verify modal opens. Wait for poll, verify modal stays open.
- **Environment**: Click truncated string, verify modal opens.
