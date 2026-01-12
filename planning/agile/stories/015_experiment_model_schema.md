# Create Experiment Model

- **Status:** DONE
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
- [x] References `planId`.
- [x] Tracks `status` (INITIALIZING, RUNNING, COMPLETED).
- [x] Stores `currentEnvironment` state.

## Testing
1. Create dummy experiment doc.

## Review Log

**1/5/2026** - Accepted by Product Owner