# Implement Persistent Logger Service

- **Status:** DONE
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
- [x] Subscribes to `LOG` event.
- [x] Subscribes to lifecycle events (STEP_START, etc) and auto-generates logs.
- [x]  writes `LogEntry` to DB.

## Testing
1. Emit event on bus.
2. Check for new document in `logs` collection.

## Review Log
**1/6/2026** - Accepted by Product Owner