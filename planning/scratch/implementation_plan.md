# Container Security Hardening Implementation Plan

This plan addresses User Story 052 to enforce resource limits on the Docker containers used for executing user-defined code.

## User Review Required

> [!IMPORTANT]
> This change introduces default resource limits.
> - Default **CPU Quota**: 50% (50000/100000)
> - Default **PIDs Limit**: 50
> - **Memory Limit**: 128MB (Already existing)
>
> Ensure these defaults are acceptable for the intended workload.

## Proposed Changes

### Backend

#### [MODIFY] [container-pool.service.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/services/container-pool.service.js)

- Update `_createContainer` method to include:
    - `PidsLimit`: Configurable via `CONTAINER_PIDS_LIMIT` (default 50).
    - `CpuQuota`: Configurable via `CONTAINER_CPU_QUOTA` (default 50000).
    - `CpuPeriod`: Fixed at 100000.
    - Ensure `Memory` limit is preserved.

#### [NEW] [container-pool.service.test.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/tests/container-pool.service.test.js)

- Create a new test suite for `ContainerPoolManager`.
- Test cases:
    - Singleton pattern works.
    - `initialize` pulls image and replenishes pool.
    - `acquire` returns a container and triggers async replenishment.
    - **Critical**: `_createContainer` passes the correct `HostConfig` with all security limits to Dockerode.
    - `shutdown` destroys all containers.

## Verification Plan

### Automated Tests
Run the new unit tests:
```bash
npm test backend/tests/container-pool.service.test.js
```

### Manual Verification
No manual verification required if unit tests pass, as this is a backend configuration change verified by checking the arguments passed to the Docker execution engine.
