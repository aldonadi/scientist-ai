---
description: Fix Experiment Controls & Improve Logging
story_points: 3
---

# Story 062: Fix Experiment Controls & Improve Logging

## Background
The user reports that the "Pause" and "Stop" buttons on the Experiment Monitor page do not function. Additionally, the log feed is cluttered with verbose hook execution logs, obscuring the actual experiment progress (model thoughts, tool calls).

## Requirements

### 1. Fix Experiment Controls
- **Frontend**: Ensure "Pause", "Resume", and "Stop" buttons in `ExperimentMonitorComponent` correctly call the `ExperimentService`.
- **Backend**: Verify `POST /api/experiments/:id/control` endpoint receives the command.
- **Orchestration**: Ensure `ExperimentOrchestrator` correctly processes `PAUSE`, `RESUME`, `STOP` signals and updates the status.
- **UI Update**: The UI should reflect the new status (e.g., changes from RUNNING to PAUSED).

### 2. Improve Logging
- **Reduce Noise**: Downgrade or hide verbose Hook execution logs (stdout/stderr) from the main "User" log view, or make them collapsible.
- **Ensure Visibility**: Ensure Model inputs/outputs (Thoughts) and Tool Execution results are clearly visible in the logs.
- **Structure**: If possible, group logs by step. (Might be out of scope for quick fix, but at least clean up the stream).

## Acceptance Criteria
- [ ] Clicking "Pause" changes experiment status to PAUSED.
- [ ] Clicking "Resume" changes status to RUNNING.
- [ ] Clicking "Stop" terminates the experiment.
- [ ] Log feed shows Model actions/thoughts clearly.
- [ ] Verbose Hook logs are suppressed or less intrusive.
