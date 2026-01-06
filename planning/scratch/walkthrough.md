# Container Pool Manager Implementation Walkthrough

I have implemented the `ContainerPoolManager` to effectively manage a pool of warm Docker containers, ensuring fast tool execution start times.

## Changes

### 1. `Container` Domain Object
A wrapper class `Container` ([backend/src/domain/container.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/domain/container.js)) was created to encapsulate the Docker container instance. 
- It tracks status (`READY`, `BUSY`, `TERMINATED`).
- It provides an `execute(cmd)` method for running commands inside the container.
- It provides a `destroy()` method for cleanup.

### 2. `ContainerPoolManager` Service
The `ContainerPoolManager` ([backend/src/services/container-pool.service.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/services/container-pool.service.js)) implements the singleton pattern to manage the pool.
- `initialize()`: Pre-warms the pool to the configured size (default 2).
- `acquire()`: Returns a ready container immediately and triggers an async replenishment.
- `_createContainer()`: Spawns new containers with:
    - `NetworkMode: 'none'` (Security)
    - `Memory: 128MB` (Resource Limit)
    - `Image: 'python:3.9-slim'`

### 3. Queue Logic
- If the pool is empty, `acquire()` automatically creates a new container on-demand (fallback).
- Replenishment happens in the background to ensure subsequent requests are fast.

## Verification Results

### Automated Tests
I implemented unit tests in `container-pool.service.test.js` covering:
- Initialization and Image Pulling.
- Acquisition and Async Replenishment.
- On-demand creation when pool is empty.
- Shutdown/Cleanup.

Tests passed successfully:
```
 PASS  src/services/container-pool.service.test.js
  ContainerPoolManager
    initialize
      ✓ should pre-warm the pool to the configured size (59 ms)
      ✓ should pull image if not present (26 ms)
    acquire 
      ✓ should return a container from the pool immediately (14 ms)
      ✓ should trigger replenishment asynchronously (46 ms)
      ✓ should create a container on-demand if pool is empty (46 ms)
    shutdown
      ✓ should destroy all containers in the pool (14 ms)
```
