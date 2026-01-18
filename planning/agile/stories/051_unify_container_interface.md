# Unify Container Interface

- **Status:** DONE
- **Points:** 5
- **Story ID:** 051
- **Type:** Bug/Refactor

## Description
There are TWO Container implementations in the codebase with DIFFERENT interfaces, and the Orchestrator uses BOTH signatures inconsistently:

### The Problem

1. **`src/domain/container.js`** (used by ContainerPoolManager):
   - Signature: `execute(cmd[], opts)`
   - Called by pool, expects command array

2. **`src/execution/container.js`** (unused?):
   - Signature: `execute(script, env, args)` 
   - Designed for Python script execution with env injection

3. **Orchestrator inconsistency**:
   - Tool execution (lines 399-403): Calls `execute(toolDoc.code, filteredEnv.variables, call.args)` - expects execution/container.js signature
   - Goal/Hook execution (lines 509-517, 631-638): Calls `execute(['python3', '-c', script], {Env: [...]})` - expects domain/container.js signature

**Result**: Tool calls will crash because the pool returns domain/container.js instances which expect `cmd[]`, not `script`.

### Review Finding Reference
- **Source**: Third-Party Review 1 (H5), Third-Party Review 2 (Section 2)
- **Severity**: BLOCKER
- **Impact**: Tool execution crashes; tests pass because they mock the container

## User Story
**As a** System,
**I want** a unified Container interface,
**So that** all container execution paths work correctly.

## Acceptance Criteria
- [x] Single Container implementation with unified interface
- [x] `execute(script, env, args)` method for Python script execution
- [x] `executeCommand(cmd[], opts)` method for raw command execution (if needed)
- [x] ContainerPoolManager returns containers with correct interface
- [x] Orchestrator tool execution works without crashing
- [x] Goal and hook execution continues to work
- [x] Delete unused Container implementation
- [x] Integration test covers tool execution path with real container

## Testing Strategy

### Unit Tests
- **File**: `backend/tests/container.test.js`
- **Cases**:
    - `execute(script, env, args)` runs Python script
    - Environment variables are injected correctly
    - Script arguments are passed correctly

### Integration Tests  
- **File**: `backend/tests/integration/tool-execution.test.js`
- **Cases**:
    - Full tool execution path: acquire container → execute tool → destroy
    - Verify tool output is captured correctly
    - Verify tool can modify environment

## Technical Notes
- Keep `src/domain/container.js` as the canonical implementation
- Add `execute(script, env, args)` convenience method that wraps `executeCommand`
- Update Orchestrator if needed to use unified interface
- Delete `src/execution/container.js` if truly unused

## Review
**1/11/26** - Accepted by Product Owner.