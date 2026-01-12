# Container Security Hardening Walkthrough

This walkthrough verifies the implementation of security resource limits (CPU, PIDs) for the Docker containers used for code execution.

## Changes

### Backend Service
Modified `backend/src/services/container-pool.service.js` to enforce resource limits on container creation:
- **PidsLimit**: Configurable via `CONTAINER_PIDS_LIMIT` (Default: 50)
- **CpuQuota**: Configurable via `CONTAINER_CPU_QUOTA` (Default: 50000)
- **CpuPeriod**: Fixed at 100000

```javascript
HostConfig: {
    NetworkMode: 'none',
    Memory: 128 * 1024 * 1024,
    PidsLimit: process.env.CONTAINER_PIDS_LIMIT ? parseInt(process.env.CONTAINER_PIDS_LIMIT) : 50,
    CpuQuota: process.env.CONTAINER_CPU_QUOTA ? parseInt(process.env.CONTAINER_CPU_QUOTA) : 50000,
    CpuPeriod: 100000,
}
```

### New Test Suite
Created `backend/tests/container-pool.service.test.js` covering:
- Singleton instance management.
- Pool initialization and replenishment.
- `acquire()` logic (on-demand creation vs pool).
- **Security Limits verification** (Default and Configured values).

## Verification Results

### Automated Tests
Ran `jest tests/container-pool.service.test.js` in `backend` directory.

**Result**: PASS
```
 PASS  tests/container-pool.service.test.js
  ContainerPoolManager
    ✓ should be a singleton (19 ms)
    initialize()
      ✓ should pre-warm the pool (37 ms)
    acquire()
      ✓ should return a container and trigger replenishment (22 ms)
      ✓ should create on-demand if pool is empty (18 ms)
    _createContainer security limits
      ✓ should apply default security limits (7 ms)
      ✓ should apply configured security limits (3 ms)
    shutdown()
      ✓ should destroy all containers (9 ms)
```

## Conclusion
The container execution environment is now hardened against fork bombs and CPU exhaustion, addressing the security vulnerabilities identified in the third-party review.
