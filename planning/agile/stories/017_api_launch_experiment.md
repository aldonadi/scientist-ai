# Implement Launch Experiment API

- **Status:** NOT READY
- **Points:** 3
- **Story ID:** 017
- **Type:** Feature

## Description
Implement POST /api/experiments to spawn a new instance from a Plan.

## User Story
**As a** User,
**I want** to run a plan,
**So that** I can start an experiment.

## Acceptance Criteria
- [ ] Accepts `planId`.
- [ ] Creates `Experiment` document.
- [ ] Copies `initialEnvironment` to `currentEnvironment`.
- [ ] Sets status to `INITIALIZING`.
- [ ] Returns experiment ID.

## Testing
1. Post planId.
2. Verify new Experiment doc created.

## Review Log
