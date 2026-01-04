# Implement List Tools API

- **Status:** READY
- **Points:** 2
- **Story ID:** 006
- **Type:** Feature

## Description
Implement the GET /api/tools endpoint to retrieve available tools, with optional filtering.

## User Story
**As a** User,
**I want** to see all available tools,
**So that** I can choose which ones to use.

## Acceptance Criteria
- [ ] GET /api/tools returns an array of tools.
- [ ] Supports query param `?namespace=X` to filter.
- [ ] Returns 200 OK.

## Testing
1. Seed DB with tools.
2. Call GET /api/tools.
3. Call GET /api/tools?namespace=default.

## Review
