# Container Security Hardening

- **Status:** DONE
- **Points:** 2
- **Story ID:** 052
- **Type:** Bug/Security

## Description
The container configuration is missing critical resource limits, creating security vulnerabilities:

1. **PidsLimit commented out** (`container-pool.service.js` line 90):
   ```javascript
   // PidsLimit: 10, // Prevent fork bombs
   ```
   A malicious script can fork bomb the host with `while True: os.fork()`

2. **No CPU quota**: Without CPU limits, a script can monopolize CPU with `while True: pass`

### Review Finding Reference
- **Source**: Third-Party Review 1 (H3, H4), Third-Party Review 2 (Section 4)
- **Severity**: HIGH
- **Impact**: Resource exhaustion, potential host crash

## User Story
**As a** System Administrator,
**I want** containers to have strict resource limits,
**So that** malicious scripts cannot crash the host system.

## Acceptance Criteria
- [x] `PidsLimit` is enabled (uncommented and set to reasonable value like 10-50)
- [x] `CpuQuota` is configured (e.g., 50000 for 50% of one CPU core)
- [x] `CpuPeriod` is set appropriately (default 100000)
- [x] Memory limit remains at 128MB or is made configurable
- [x] Limits are configurable via environment variables
- [x] Unit test verifies container creation includes all limits

## Testing Strategy

### Unit Tests
- **File**: `backend/tests/container-pool.service.test.js`
- **Cases**:
    - Container creation includes PidsLimit
    - Container creation includes CpuQuota
    - Limits are read from environment variables

### Manual Verification
- Run fork bomb script, verify it's contained
- Run infinite loop, verify CPU is throttled

## Technical Notes

Update `container-pool.service.js` `_createContainer()`:
```javascript
HostConfig: {
    NetworkMode: 'none',
    Memory: 128 * 1024 * 1024,
    PidsLimit: parseInt(process.env.CONTAINER_PIDS_LIMIT) || 50,
    CpuQuota: parseInt(process.env.CONTAINER_CPU_QUOTA) || 50000,
    CpuPeriod: 100000,
}
```

## Review
**1/11/26** - Accepted by Product Owner.