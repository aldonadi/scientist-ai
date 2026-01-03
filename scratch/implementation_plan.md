# Implementation Plan: Ephemeral Docker Execution Environment

## Goal
Design a robust, high-performance, and secure execution environment for Python tools using Docker containers. To minimize latency, we will implement a "Hot Standby" pool of pre-warmed containers.

## User Review Required
> [!IMPORTANT]
> **Execution Strategy**: We will use an "Execute-and-Destroy" strategy. Containers are pulled from a "Warm Pool", used for a *single* step/tool execution, and then destroyed. This ensures perfect isolation and prevents state pollution between steps. The pool automatically replenishes itself in the background.

## Proposed Changes

### [SPEC.md](file:///home/andrew/Projects/Code/web/scientist-ai/SPEC.md)

#### [NEW] Domain Objects
- **ContainerPool**: Manages the lifecycle of idle containers.
  - `maxSize`: int (default 2 or 3)
  - `acquire()`: Returns a ready container.
  - `replenish()`: Spawns new containers to fill the pool.
- **ContainerWrapper**: Represents a single Docker container instance.
  - `id`: String
  - `status`: Enum (STARTING, READY, BUSY, TERMINATED)
  - `execute(script, env)`: Runs command.

#### [MODIFY] Execution Engine
- Update **Lifecycle** to use `ContainerPool.acquire()` instead of `spawn process`.
- Add **Container Lifecycle** section detailing the "Warm Pool" logic.

#### [MODIFY] Technology Stack
- Add `dockerode` (Node.js Docker client) or similar.
- Add `python:3.11-slim` (or custom image) as the base runner image.

## Verification Plan
- **Manual verification**: Review SPEC.md against user requirements for "hot standby".
- **Diagram check**: Ensure Class Diagram and Flowcharts (if detailed enough) reflect this.
