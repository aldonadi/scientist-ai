# Implementation Plan: Architectural Separation of Concerns

## Goal
Decouple the "Experiment" domain (State, Plans, Roles) from the "Backend" infrastructure (Docker, Node.js Process, Event Bus emissions). The `Experiment` object should be a passive state holder, and a separate `ExperimentRunner` service should drive the execution using interfaces.

## User Review Required
> [!IMPORTANT]
> **Major Refactor**: The `Experiment` class will lose its `start()` and `step()` methods. These will move to a new `ExperimentRunner` service. The `Experiment` entity will effectively become a data structure (Model) rather than an active object.

## Proposed Changes

### [SPEC.md](file:///home/andrew/Projects/Code/web/scientist-ai/SPEC.md)

#### [NEW] Interfaces
- **IExecutionEnvironment**: Interface for the isolation layer.
  - `runCommand(image, script, env, args) -> Result`
  - Implementation: `DockerExecutionEnvironment` (wraps ContainerPool).
- **IScriptRunner**: Interface for running specific script types.
  - `runTool(tool, env) -> Result`
  - `runHook(hook, context) -> void`

#### [MODIFY] Domain Objects
- **Experiment**:
    - [DELETE] `start()`, `step()`, `pause()`, `stop()`, `events`.
    - [NEW] `status`, `data`, `plan` (Pure state).
    - *Rationale*: The Experiment entity shouldn't know *how* to run itself, only *what* its current state is.

#### [NEW] Services (The "Backend" Layer)
- **ExperimentOrchestrator** (The "Engine"):
    - Owns the `EventBus`.
    - Accepts an `Experiment` (state) and `ExperimentPlan`.
    - Implements the `Step Loop`.
    - Uses `IExecutionEnvironment` to run tools.
    - Updates the `Experiment` state object.
    
#### [MODIFY] Class Diagram
- Show `ExperimentOrchestrator` depending on `IExecutionEnvironment`.
- Show `Experiment` as a data object used by `Orchestrator`.

## Verification Plan
- **Logical Check**: Ensure `Experiment` object has ZERO dependencies on Docker, EventBus, or Node.js runtime specifics.
- **Diagram Check**: The dependency arrow should go `Orchestrator -> Experiment`, not `Experiment -> Infrastructure`.
