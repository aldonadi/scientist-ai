# Implement Persistent Logger Service

- **Status:** READY
- **Points:** 3
- **Story ID:** 019
- **Type:** Feature

## Description
Create a service that subscribes to the EventBus and writes logs to MongoDB.

## User Story
**As a** User,
**I want** activities to be logged automatically,
**So that** I don't lose history.

## Acceptance Criteria
- [ ] Subscribes to `LOG` event.
- [ ] Subscribes to lifecycle events (STEP_START, etc) and auto-generates logs.
- [ ]  writes `LogEntry` to DB.

## Testing
1. Emit event on bus.
2. Check for new document in `logs` collection.

## Review Log
