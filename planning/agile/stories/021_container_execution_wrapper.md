# Implement Container Execution Wrapper

- **Status:** NOT READY
- **Points:** 5
- **Story ID:** 021
- **Type:** Feature

## Description
Implement the `Container` class that wraps a Docker container. This class acts as an ephemeral execution environment for running Python scripts safely. The lifecycle of a container logic (start, execute, destroy) is managed here, although valid "Pool" management is handled by a separate story.

### Class Definition: `Container`

#### Members
- `id`: String (Docker Container ID).
- `status`: Enum (`STARTING`, `READY`, `BUSY`, `TERMINATED`).
- `expiry`: Timestamp (Used for cleaning up stuck containers).
- `dockerClient`: Instance of `dockerode` client (injected or singleton).

#### Methods
- `constructor(dockerClient, id)`: Initializes the wrapper with an existing container ID (or starts one if adapted).
- `execute(script: string, env: object, args: object)`:
    - **Purpose**: Runs a Python script inside the container.
    - **Process**:
        1.  Transitions status to `BUSY`.
        2.  Writes `script` to a temporary file inside the container (or pipes via stdin).
        3.  Injects `env` variables and `args` (as JSON or CLI arguments).
        4.  Executes the command.
        5.  Captures `stdout`, `stderr`, `exitCode`.
        6.  Returns `ExecutionResult` object.
- `destroy()`:
    - **Purpose**: Force kills and removes the container.
    - **Process**:
        1.  Uses `dockerode` to kill and remove the container.
        2.  Transitions status to `TERMINATED`.

## User Story
**As a** System,
**I want** to run python scripts in isolated Docker containers,
**So that** user-defined code cannot compromise the host system and side-effects are contained.

## Acceptance Criteria
- [x] `Container` class is implemented with `id`, `status`, and `expiry`.
- [x] Uses `dockerode` to interact with the Docker daemon.
- [x] `execute(script, env, args)` method implemented:
    - [x] Correctly injects environment variables.
    - [x] Correctly passes arguments to the script.
    - [x] Captures and returns `{ stdout, stderr, exitCode, duration }`.
    - [x] Handles script timeouts or crashes gracefully (returns exit code not throws exception).
- [x] `destroy()` method implemented:
    - [x] Successfully removes the container from Docker.
    - [x] Updates status to `TERMINATED`.
- [x] `status` transitions are managed correctly (`READY` -> `BUSY` -> `TERMINATED` or back to `READY` if we were reusing, but SPEC says "One-Shot" mostly, actually SPEC says "execute-and-destroy", so `execute` might trigger `destroy` at the end or caller does). **Clarification**: SPEC Section 12.4 says "Destruction: Once execution completes... the container is Terminated." So `execute` should probably not auto-destroy, but the Orchestrator will call `destroy`. However, this story is just the Wrapper.
- [x] Unit tests using a mock `dockerode` to verify logic without needing actual Docker daemon (for unit tests).
- [x] Integration tests using actual Docker to verify real execution.

## Testing Strategy

### Unit Tests (Mock Docker)
- **File**: `backend/src/execution/container.test.js`
- **Cases**:
    - `execute` calls `docker.getContainer(...).exec(...)` with correct parameters.
    - `execute` handles stream output correctly.
    - `destroy` calls `container.remove({ force: true })`.
    - `expiry` is set correctly on initialization.

### Integration Tests (Real Docker)
- **File**: `backend/src/execution/container.integration.test.js`
- **Cases**:
    - **Hello World**: Run `print("Hello World")`, verify stdout="Hello World\n", exitCode=0.
    - **Args**: Run script that prints `sys.argv[1]`, pass arg "test", verify output.
    - **Env**: Run script that prints `os.environ["TEST_VAR"]`, pass env `{TEST_VAR: "foo"}`, verify output.
    - **Error**: Run `raise Exception("Boom")`, verify stderr contains "Boom", exitCode!=0.
    - **Destroy**: Call `destroy()`, verify `docker ps` does not show the container.

## Technical Notes
- Use `dockerode` npm package.
- Image to use: `python:3.9-slim` (or configured via environment variable).
- Ensure `stream` processing for `exec` output is handled robustly (dockerode exec streams can be tricky with demultiplexing).
