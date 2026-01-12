# Implementation Plan - Unify Container Interface (Story 051)

## Goal Description
Unify the conflicting `Container` class implementations into a single canonical class in `src/domain/container.js` that supports the `execute(script, env, args)` signature required for robust Python execution. This will fix the crashing tool executions and simplify the Orchestrator.

## User Review Required
> [!IMPORTANT]
> This refactor involves deleting `src/execution/container.js` and moving its logic to `src/domain/container.js`.

## Proposed Changes

### Backend

#### [MODIFY] [container.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/domain/container.js)
- Import `PassThrough` from `stream`.
- Add `execute(script, env, args)` method (ported from `src/execution/container.js`) which:
    - Accepts Python script string, environment object, and arguments array.
    - Handles writing script to stdin (`python3 -`).
    - managing stream demultiplexing.
- Rename existing `execute(cmd, opts)` to `executeCommand(cmd, opts)` for raw command usage.
- Ensure constructor remains compatible with `ContainerPoolManager` (`id`, `dockerContainer`).

#### [DELETE] [container.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/execution/container.js)
- Remove as it is being merged into domain.

#### [MODIFY] [container-pool.service.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/services/container-pool.service.js)
- Ensure it continues to import from `../domain/container`.
- (The instantiation logic matches the domain container signature, so minimal changes expected here).

#### [MODIFY] [experiment-orchestrator.service.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/services/experiment-orchestrator.service.js)
- **Tool Execution**: Update to ensure it calls `container.execute(code, env, args)`.
- **Hooks & Goals**: Update to use `container.execute(wrapperScript, envMap, [])` instead of manually constructing `python3 -c ...` commands and Env strings. This aligns all execution paths to the safe stdin-based injection.

### Tests

#### [NEW] [container.test.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/tests/container.test.js)
- Port unit tests from `src/execution/container.test.js`.
- Update to test `src/domain/container.js`.
- Adjust mocks to match `(id, dockerContainer)` constructor signature.
- **Delete** `src/execution/container.test.js`.

#### [NEW] [tool-execution.test.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/tests/integration/tool-execution.test.js)
- Implement integration test as requested.
- Verify full flow: `ContainerPool -> acquire -> execute -> destroy`.

## Verification Plan

### Automated Tests
- Run unit tests: `npm test backend/tests/container.test.js`
- Run integration tests: `npm test backend/tests/integration/tool-execution.test.js`
- Run orchestrator tests: `npm test backend/src/services/experiment-orchestrator.service.test.js`

### Manual Verification
- None required if integration tests pass, as this is a backend refactor.
