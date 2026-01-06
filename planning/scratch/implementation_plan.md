# Implementation Plan - Container Execution Wrapper (Story 021)

## Goal Description
Implement the `Container` class which serves as a wrapper around Docker containers, providing a safe sandbox for executing Python scripts. This corresponds to User Story 021.

## User Review Required
> [!WARNING]
> The `docker` CLI was not found in the current environment. Integration tests requiring actual Docker execution may fail or be skipped. The implementation will rely primarily on `dockerode` and unit tests with mocks. I will still implement the integration tests for future use when Docker is available.

## Proposed Changes

### Backend

#### [NEW] [container.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/execution/container.js)
- Implement `Container` class.
- **Dependencies**: `dockerode`, `fs/promises` (or `tmp` file usage), `path`.
- **Members**: `id`, `status` (Enum), `expiry`.
- **Methods**:
  - `constructor(dockerClient, id)`
  - `execute(script, env, args)`: Handles file creation, container execution, output capturing.
  - `destroy()`: Cleans up the container.

#### [NEW] [container.test.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/execution/container.test.js)
- Unit tests using a mocked `dockerode` instance.
- Verify `execute` flow (file copy, exec start, stream handling).
- Verify `destroy` flow.

#### [NEW] [container.integration.test.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/execution/container.integration.test.js)
- Real docker tests (will likely fail in current env but good to have).
- Run simple python scripts and verify output.

## Verification Plan

### Automated Tests
- **Unit Tests**: `npm test src/execution/container.test.js`
    - Creates a mock Docker client.
    - Simulates success and error paths.
- **Integration Tests**: `npm test src/execution/container.integration.test.js`
    - Tries to connect to real Docker daemon.
    - **Note**: Expected to fail if Docker is not present.

### Manual Verification
- None required beyond automated tests as this is a backend service component.
