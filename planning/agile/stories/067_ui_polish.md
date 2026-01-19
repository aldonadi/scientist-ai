# User Story: UI Polish & Stability Fixes

## Problem
The Experiment Monitor UI has usability issues related to polling and data visibility:
1. **Poll Reset**: Every few seconds, the poll refreshes data, causing text selection to disappear and "Thinking Process" blocks to close.
2. **Truncation**: Long strings in the Environment View and State History tab are truncated (often to 50 or 100 chars), with no way to see the full content.

## Solution
1. **Polling Stability**: Implement `trackBy` in all lists (Logs, Chat History, State History) to prevent DOM destruction on data refresh.
2. **Data Modals**:
   - Add double-click handler to State History cells to open a modal with full content.
   - Add click-to-view feature for truncated strings in Environment View.

## Tasks
- [ ] Create 067_ui_polish.md
- [ ] FE: Fix ExperimentMonitor polling (Chat History trackBy)
- [ ] FE: Fix LogFeed polling (trackBy)
- [ ] FE: Fix StateHistory polling (trackBy)
- [ ] FE: Implement JSON Tree View Modal
- [ ] FE: Implement State History Cell Modal
- [ ] Verify functionality
