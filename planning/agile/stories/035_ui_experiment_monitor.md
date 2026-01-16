# Implement Experiment Monitor View

- **Status:** IN-PROGRESS
- **Points:** 8
- **Story ID:** 035
- **Type:** Feature

## Description
Create the comprehensive 'Scientist' view for running experiments.

## User Story
**As a** Scientist,
**I want** a dashboard for the running experiment,
**So that** I can see what's happening.

## Acceptance Criteria
- [x] Shows current status/step.
- [x] 3-panel layout (Logs, Activity, Environment).
- [x] Log feed component.
- [x] JSON tree view for environment.

## Testing
1. Open an experiment ID.
2. Verify layout loads.

## Review Log
- 2026-01-15: Implementation complete. Created LogFeedComponent, JsonTreeComponent, and full ExperimentMonitorComponent with 3-panel layout, status/step display, control buttons, and polling for updates. Build passes.

