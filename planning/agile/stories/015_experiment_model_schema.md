# Create Experiment Model

- **Status:** READY
- **Points:** 1
- **Story ID:** 015
- **Type:** Feature

## Description
Define Mongoose schema for `Experiment` (runtime instance).

## User Story
**As a** Developer,
**I want** a schema for running experiments,
**So that** I can track state and status.

## Acceptance Criteria
- [ ] References `planId`.
- [ ] Tracks `status` (INITIALIZING, RUNNING, COMPLETED).
- [ ] Stores `currentEnvironment` state.

## Testing
1. Create dummy experiment doc.

## Review Log
