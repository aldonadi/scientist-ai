# Create Log Entry Model

- **Status:** DONE
- **Points:** 1
- **Story ID:** 016
- **Type:** Feature

## Description
Define Mongoose schema for `LogEntry`.

## User Story
**As a** Developer,
**I want** a structured log format,
**So that** I can debug experiments post-mortem.

## Acceptance Criteria
- [x] Fields: `experimentId`, `stepNumber`, `source`, `message`, `data`.
- [x] Index on `experimentId`.

## Testing
1. Create a log entry.

## Review Log
**1/5/2026** - Accepted by Product Owner
