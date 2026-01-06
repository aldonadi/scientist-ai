# Container Pool Manager Implementation Plan

Implement the `ContainerPoolManager` to manage a warm pool of Docker containers for executing tools efficiently.

## User Review Required

> [!IMPORTANT]
> This implementation requires the `docker` daemon to be running and accessible by the backend process.
> The `ContainerPoolManager` will automatically pull the standard python image (e.g., `python:3.9-slim`) if not present, which might take time on first run.

## Proposed Changes

### Backend

#### [NEW] [container-pool.service.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/services/container-pool.service.js)

- **Class**: `ContainerPoolManager`
- **Responsibilities**:
    - Manage a pool of "warm" Docker containers.
    - Provide `acquire()` method to get a container.
    - Provide `replenish()` method to maintain pool size.
    - Provide `shutdown()` to clean up.
- **Dependencies**: `dockerode`, `uuid`, `config` (if available, else process.env).
- **Structure**:
    - `constructor()`: Initialize docker client, pool array.
    - `async initialize()`: Start initial replenishment.
    - `async acquire()`: Return a container object. If pool empty, spark creation (blocking or fast-path).
    - `async _createContainer()`: Internal method to spawn a container with limits (network disabled/restricted, default user, memory limits).
    - `async _replenish()`: Fill pool to `poolSize`.
    - `async shutdown()`: cleanup.

#### [NEW] [container.domain.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/domain/container.js) (Optional)

The spec mentions `Container` as a domain object. I might define a simple wrapper class or just use the raw dockerode container object enriched with metadata. A wrapper is cleaner.
- **Class**: `Container`
- **Properties**: `id`, `dockerContainer` (dockerode instance), `expiry`.
- **Methods**: `destroy()`, `execute(cmd)`.

## Verification Plan

### Automated Tests
- **Unit Tests**: Create `backend/src/services/container-pool.service.test.js` using `jest` and mocking `dockerode`.
    - Test `acquire` gets a container.
    - Test `replenish` calls docker create.
    - Test `shutdown` removes containers.
    - Test error handling (docker daemon down).

### Manual Verification
1.  Start the backend (ensure docker is running).
2.  Check docker stats (`docker ps`) to see warm containers (e.g. 2 idle python containers).
3.  (Ideally) Hit an endpoint that triggers a tool execution (but tool execution is not yet implemented, so we verify via logs or unit tests mainly).
4.  Kill the backend; verify containers are cleaned up (via `shutdown` hook if integrated, otherwise manual cleanup might be needed during dev).
