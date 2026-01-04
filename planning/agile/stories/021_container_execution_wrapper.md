# Implement Container Execution Wrapper

- **Status:** READY
- **Points:** 5
- **Story ID:** 021
- **Type:** Feature

## Description
Implement the `Container` class that wraps a Docker container and provides an `execute(script)` method.

## User Story
**As a** System,
**I want** to run python scripts in Docker,
**So that** they are sandboxed.

## Acceptance Criteria
- [ ] `execute` accepts python code.
- [ ] Writes code to temp file in container or pipes to stdin.
- [ ] Captures stdout/stderr.
- [ ] Returns execution result object.

## Testing
1. Execute `print('hello')` in a container.
2. Verify output.

## Review Log
