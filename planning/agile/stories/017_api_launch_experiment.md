# Implement Launch Experiment API

- **Status:** DONE
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
- [x] Accepts `planId`.
- [x] Creates `Experiment` document.
- [x] Copies `initialEnvironment` to `currentEnvironment`.
- [x] Sets status to `INITIALIZING`.
- [x] Returns experiment ID.

## Testing
1. Post planId.
2. Verify new Experiment doc created.

## Review Log
**1/5/2026** - Accepted by Product Owner