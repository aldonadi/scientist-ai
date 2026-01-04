# Implement Experiment Orchestrator Initialization

- **Status:** NOT READY
- **Points:** 5
- **Story ID:** 024
- **Type:** Feature

## Description
Implement the startup phase of `ExperimentOrchestrator`: loading the plan, setting up the bus, and emitting start events.

## User Story
**As a** System,
**I want** to initialize experiments correctly,
**So that** all components are ready before the first step.

## Acceptance Criteria
- [ ] Loads Experiment and Plan from DB.
- [ ] Instantiates EventBus.
- [ ] Emits `EXPERIMENT_START`.

## Testing
1. Call `start()`.
2. Verify events emitted.

## Review Log
