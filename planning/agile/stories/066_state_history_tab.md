# State History Tab in Experiment Monitor

- **Status:** READY
- **Points:** 8
- **Story ID:** 066
- **Type:** Feature

## Description
Add a new "State History" tab to the Experiment Monitor that visualizes the evolution of the environment variables across experiment steps. This feature helps users debug and understand how the state changes over time. It requires a backend generic mechanism to snapshot the state at the end of each step and a frontend table component with advanced column management and export capabilities.

## User Story
**As a** User,
**I want** to see a history of state variables for each step of the experiment,
**So that** I can trace how the environment state evolves and debug issues.

## Acceptance Criteria
- [ ] **Backend: State Snapshots**:
    - The system must capture a deep copy of the environment variables at the end of each step (after all scripts for that step have executed).
    - These snapshots should be stored efficiently (likely a separate collection/model) to avoid document size limits.
    - New API `GET /api/experiments/:id/history` to retrieve the step history.
- [ ] **Frontend: State History Tab**:
    - A new tab "State History" in the Experiment Monitor.
    - Displays a table with one row per step.
    - Columns represent state variables.
- [ ] **Frontend: Column Management**:
    - By default, display the first 15 variables.
    - User can add/remove columns.
    - User can specify custom keys for complex values (e.g., `myDict.someKey`).
    - Configuration should persist (local storage or per-session).
- [ ] **Frontend: Sorting & Refresh**:
    - Default sorting: Chronological (Step 1 -> N).
    - User can toggle sort order.
    - Data auto-refreshes every 5 seconds (only if experiment is running).
- [ ] **Frontend: Export**:
    - "Export to CSV" button that downloads the full history table as a CSV file.
- [ ] **UI/UX**:
    - Handle large numbers of columns with horizontal scrolling.
    - Handle complex values (diplay JSON or truncated string if no key specified).

## Technical Implementation Plan
1.  **Backend**:
    - Create `ExperimentStateHistory` Mongoose model.
    - Update `ExperimentOrchestrator` to save state snapshot at the end of `processStep`.
    - Implement `GET /api/experiments/:id/history` endpoint.
2.  **Frontend**:
    - Create `StateHistoryComponent`.
    - Implement data fetching with polling.
    - Implement dynamic table with custom column definitions.
    - Implement CSV export utility.

## Testing
- Verify state is captured correctly at end of each step.
- Verify table displays correct values for simple and nested inputs.
- Verify deep key access (e.g., `user.name`) works in columns.
- Verify sorting and pagination (if applicable, though probably just infinite scroll/virtualization or plain list for now).
- Verify CSV export contains all data.
