# System Health Modal

- **Status:** READY
- **Points:** 3
- **Story ID:** 064
- **Type:** Feature

## Description
Create a "System Health" modal dialog that provides detailed information about the system's status. This modal should be accessible by clicking on the system status badges in the application header.

## Mockup
```text
+-------------------------------------------------------------+
|  SYSTEM HEALTH                                          [X] |
+-------------------------------------------------------------+
|  Status:        [ ONLINE ] (Green/Red badge)                |
|  System Health: [ 100% OK ]                                 |
|                                                             |
|  DETAILED METRICS                                           |
|  ---------------------------------------------------------  |
|  Uptime:       2 days, 4 hours                              |
|  Database:     Connected                                    |
|  Backend:      Reachable                                    |
|                                                             |
|  CONTAINER POOL                                             |
|  ---------------------------------------------------------  |
|  Status:       Active                                       |
|  Available:    2 / 2                                        |
|  Image:        python:3.9-slim                              |
|                                                             |
|  [ Close ]                                                  |
+-------------------------------------------------------------+
```

## User Story
**As a** User,
**I want** to view detailed system health information in a modal,
**So that** I can diagnose issues and understand the current state of the system resources.

## Acceptance Criteria
- [ ] Header status badges are clickable and open the modal.
- [ ] Modal displays "Status" (Online/Offline).
- [ ] Modal displays "System Health" summary.
- [ ] Modal provides detailed metrics:
    - [ ] Uptime (formatted duration).
    - [ ] Database connection status.
    - [ ] Backend connection status.
- [ ] Modal provides Container Pool information:
    - [ ] Pool Size / Available count.
    - [ ] Current Image.
- [ ] Backend `/api/health` endpoint is updated to return all necessary data.

## Testing
1. Click "ONLINE" or "System Health" in the header.
2. Verify Modal opens.
3. Verify all metrics match actual system state (can mock backend response for failure cases).
4. Verify "Close" button works.
