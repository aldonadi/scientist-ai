# Implementation Plan: Story 035 - Experiment Monitor UI

## Background

Create the comprehensive "Scientist" view for running experiments. This is an 8-point story that requires:
1. A 3-panel dashboard layout
2. Real-time status and step display
3. Log feed component
4. JSON tree view for environment variables

## Existing State

A basic skeleton already exists at:
- [experiment-monitor.component.ts](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/features/experiments/experiment-monitor.component.ts) - Basic 3-column layout with static placeholders
- [experiment.service.ts](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/core/services/experiment.service.ts) - Service with `getExperiment()`, `getLogs()`, `controlExperiment()`

---

## Proposed Changes

### Experiments Feature Module

#### [MODIFY] [experiment-monitor.component.ts](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/features/experiments/experiment-monitor.component.ts)

Complete rewrite to implement:
- **Header**: Experiment name/ID, status badge, step counter (e.g., "Step 3/50")
- **Controls**: Pause/Resume/Stop buttons connected to `ExperimentService.controlExperiment()`
- **3-Panel Layout**:
  - Left: Log feed (using new LogFeedComponent)
  - Center: Role activity display (current agent thinking, tool calls)
  - Right: Environment inspector (using new JsonTreeComponent)
- **Data Loading**: Fetch experiment and logs on init, poll for updates

#### [NEW] [log-feed.component.ts](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/features/experiments/log-feed.component.ts)

Reusable component for displaying log entries:
- **Input**: `logs: LogEntry[]`
- **Features**:
  - Color-coded entries by source (SYSTEM=gray, ROLE=blue, TOOL=green, ERROR=red)
  - Timestamp formatting
  - Auto-scroll to latest entry
  - Compact monospace display

#### [NEW] [json-tree.component.ts](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/features/experiments/json-tree.component.ts)

Reusable JSON tree viewer:
- **Input**: `data: any`
- **Features**:
  - Expandable/collapsible object nodes
  - Syntax highlighting (keys=purple, strings=green, numbers=blue, booleans=orange)
  - Nested indentation
  - Click to expand/collapse

#### [MODIFY] [index.ts](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/src/app/features/experiments/index.ts)

Export new components.

---

## Verification Plan

### Automated Tests
- Run `npm run start` in frontend directory
- Navigate to `/experiments/{id}` with a real experiment ID

### Manual Verification
1. Verify header displays experiment status and step count
2. Verify Pause/Resume/Stop buttons work
3. Verify log feed displays entries with correct colors
4. Verify environment JSON tree is expandable
5. Verify layout is responsive

---

## Notes

- **SSE Streaming** is Story 036 - this story will use polling as a fallback
- The "Activity" panel will display the most recent role/tool activity from logs
