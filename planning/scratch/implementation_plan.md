# Implementation Plan - Container Execution Wrapper (Story 021)

## Goal Description
Implement the `Container` class which serves as a wrapper around Docker containers, providing a safe sandbox for executing Python scripts. This corresponds to User Story 021.

## User Review Required
> [!WARNING]
> The `docker` CLI was not found in the current environment. Please refer to the **Prerequisite: Docker Installation** section below for setup instructions.

### Prerequisite: Docker Installation (Ubuntu 24.04 LTS)

**Note:** This procedure installs the latest stable version of Docker Engine (Community Edition) from the official Docker repository, which is the recommended approach for Ubuntu.

1.  **Remove conflicting packages (if any):**
    *   *Theory:* Ensure no unofficial or old versions clash with the new installation.
    ```bash
    for pkg in docker.io docker-doc docker-compose docker-compose-v2 podman-docker containerd runc; do sudo apt-get remove $pkg; done
    ```

2.  **Set up Docker's `apt` repository:**
    *   *Theory:* Add Docker's official GPG key and repository URL to your system's package source list so `apt` knows where to trust and download the packages from.
    ```bash
    # Add Docker's official GPG key:
    sudo apt-get update
    sudo apt-get install ca-certificates curl
    sudo install -m 0755 -d /etc/apt/keyrings
    sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
    sudo chmod a+r /etc/apt/keyrings/docker.asc

    # Add the repository to Apt sources:
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update
    ```
    *   *Expected Output (Final step):* You should see lines hitting `https://download.docker.com/linux/ubuntu` in the `apt-get update` output.

3.  **Install the specific packages:**
    *   *Theory:* We install the core engine (`docker-ce`), the CLI tool (`docker-ce-cli`), the runtime (`containerd.io`), and standard plugins.
    ```bash
    sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    ```

4.  **Verify the installation:**
    *   *Theory:* Run the "hello-world" image to check if the daemon is running and can pull images.
    ```bash
    sudo docker run hello-world
    ```
    *   *Expected Output:* A message saying "Hello from Docker! This message shows that your installation appears to be working correctly."

5.  **(Optional but Recommended) Post-installation steps for Linux:**
    *   *Theory:* Improve usability by allowing you to run docker commands without `sudo`.
    ```bash
    sudo groupadd docker
    sudo usermod -aG docker $USER
    newgrp docker
    ```
    *   *Verification:* Run `docker run hello-world` (without `sudo`).

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
