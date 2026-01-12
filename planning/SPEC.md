# Project Specification: Scientist.ai

## 1. Architecture Overview

The system uses the MEAN stack (MongoDB, Express, Angular, Node.js) to provide a
robust platform for designing and running agentic AI experiments.

- **Frontend**: Angular application serving as the "Scientist" interface.
- **Backend**: Node.js/Express REST API server.
- **Database**: MongoDB for storing plans, experiments, logs, and object definitions.
- **Execution Engine**: Node.js orchestrator that spawns Python subprocesses (managed via Docker containers) for executing Tools and Scripts.
- **AI Interface**: Module to communicate with LLM providers (initially Ollama).
- **Event Bus**: Internal Node.js EventEmitter to decouple lifecycle events, logging, and hooks.

## 2. Domain Objects & Class Layout

### 2.1 Core Objects

#### **EventBus**

- **Purpose**: Decouples the Execution Engine from side-effects (Logging, UI Updates, Hooks).
- **Members**:
  - `subscribers`: Map<EventType, List<Callback>>.
- **Methods**:
  - `emit(eventType, payload)`: Synchronously notifies all subscribers.
  - `on(eventType, callback)`: Registers a listener.
- **Event Types**:
  - `EXPERIMENT_START`: `{ experimentId, planName }`
  - `STEP_START`: `{ experimentId, stepNumber }`
  - `ROLE_START`: `{ roleName }`
  - `MODEL_PROMPT`: `{ roleName, messages }`
  - `MODEL_RESPONSE_CHUNK`: `{ roleName, chunk }` (Streaming)
  - `MODEL_RESPONSE_COMPLETE`: `{ roleName, fullResponse }`
  - `TOOL_CALL`: `{ toolName, args }`
  - `TOOL_RESULT`: `{ toolName, result, envChanges }`
  - `STEP_END`: `{ stepNumber, environmentSnapshot }`
  - `EXPERIMENT_END`: `{ result, duration }`
  - `LOG`: `{ source, level, message, data }`

#### **Container** (Ephemeral)
- **Purpose**: Represents a single Docker container instance.
- **Members**:
  - `id`: String (Docker Container ID).
  - `status`: Enum (STARTING, READY, BUSY, TERMINATED).
  - `expiry`: Timestamp (For cleaning up stuck containers).
- **Methods**:
  - `execute(script, env, args)`: Runs a command inside the container.
  - `destroy()`: Force kills and removes the container.

#### **ContainerPool**
- **Purpose**: Manages a reservoir of "Warm" containers to minimize latency.
- **Members**:
  - `poolSize`: Integer (Configurable, e.g., 2).
  - `available`: Queue<Container>.
- **Methods**:
  - `acquire()`: Returns a ready Container from the pool. (Triggers async replenishment).
  - `replenish()`: Spawns new containers until `available.length == poolSize`.
  - `shutdown()`: Destroys all containers.

#### **Environment**

- **Purpose**: Holds the state of an experiment step.
- **Members**:
  - `variables`: Map<String, Any> (Values).
  - `variableTypes`: Map<String, String> (Type definitions: `string`, `int`,
    `float`, `bool`, `enum:[A,B]`).
- **Methods**:
  - `deepCopy()`: Returns a new Environment instance with detached state.
  - `toJSON()`: Serializes state for storage or API transmission.
  - `get(key)`: Retrieval.
  - `set(key, value)`: Modification (enforces type safety based on `variableTypes`).

#### **Tool**

- **Purpose**: Action capability for an agent.
- **Members**:
  - `name`: String (Unique within namespace).
  - `namespace`: String.
  - `description`: String (For LLM consumption).
  - `parameters`: JSON Schema definition of accepted arguments.
  - `code`: String (Python source code).
- **Methods**:
- **Methods**:
  - `execute(environment, arguments, context)`: Runs the python script.
    - `context`: `ToolContext` object containing a scoped `logger`.
    - Returns output, may modify environment.

#### ModelConfig

- **Purpose**: Specifies a Model and its provider and configuration.
- **Members**:
  - `provider`: `Provider`. Backend used to communicate with model.
  - `modelName`: String. Passed to backend to identify which model to inference with.
  - `config`: JSON. Provider- and Model-specific config (e.g., temperature, top_p) which is passed to the Provider as-is.
- **Methods**:
  - `isValid()`: Returns `true` if `provider` can be communicated with and the `modelName` is valid with the `provider`.
  - `chat(history, tools)`: wrapper around `provider.chat`.
    - `history`: List of message objects `{role: string, content: string}`.
    - `tools`: List of tool definitions.
    - Returns: A stream of events/tokens.

#### Provider

- **Purpose**: Interface between this app and backend driver (e.g. Ollama, OpenAI, Anthropic, etc).
- **Members**:
  - `name`: String (e.g., "Ollama Local", "OpenAI").
  - `type`: Enum (OLLAMA, OPENAI, ANTHROPIC, GENERIC_OPENAI).
  - `baseUrl`: String (URL to the API endpoint).
  - `apiKey`: String (Reference to Secret Manager or Encrypted Storage).
- **Methods**:
  - `isValid()`: Returns `true` if a connection to this Provider can be established successfully.
  - `isModelReady(modelName)`: Returns `true` if the provider reports that a model by this name can be chatted with.
  - `listModels()`: Returns a list of available model names.
  - `chat(modelName, history, tools, config)`: Initiates a chat completion request and returns a stream.

#### **Role**

- **Purpose**: Defines an Agent's identity and capabilities.
- **Members**:
  - `name`: String.
  - `modelConfig`: ModelConfig (Provider, Model Name, Temp, etc.).
  - `systemPrompt`: String.
  - `tools`: `List<ToolReference>`.
  - `variableWhitelist`: `List<String>` (Defines which Environment variables
    this Role can see).
- **Methods**:
  - `constructPrompt(environment)`: Builds the context window.
  - Note: Streaming data is captured by the Experiment execution engine and emitted via events/logs. The Role object defines *how* to interact, but the `Experiment` class manages the actual I/O stream.

#### **Goal**

- **Purpose**: Termination condition.
- **Members**:
  - `description`: String.
  - `conditionScript`: String (Python boolean expression or function).
- **Methods**:
  - `evaluate(environment)`: Boolean.

### **Script**

- **Members**:
  - `hookType`: Enum (Maps to EventTypes).
    - `EXPERIMENT_START`
    - `STEP_START` (etc...)
  - `code`: String (Python).
  - `failPolicy` : Enum
    - `ABORT_EXPERIMENT`
    - `CONTINUE_WITH_ERROR`
- **Methods**:
  - `register(eventBus)`: Subscribes `this.run` to the matching event on the bus.
  - `run(payload)`: Executed when event fires.
    - `context`:
      - `experiment`: Read-only metadata.
      - `environment`: Mutable reference (if payload contains it).
      - `event`: The raw event payload.

#### **ExperimentPlan**

- **Purpose**: Template for an experiment.
- **Members**:
  - `name`: String.
  - `description`: String.
  - `initialEnvironment`: Environment.
  - `roles`: `List<Role>`.
  - `goals`: `List<Goal>`.
  - `scripts`: `List<Script>`.
  - `maxSteps`: Integer (Safety limit).

#### **Experiment** (Instance)

- **Purpose**: A running or completed instance.
- **Members**:
  - `planId`: Reference to ExperimentPlan.
  - `status`: Enum (INITIALIZING, RUNNING, PAUSED, COMPLETED, FAILED).
  - `currentStep`: Integer.
  - `currentEnvironment`: Environment.
  - `startTime`: Timestamp.
  - `endTime`: Timestamp. Empty/null until the Experiment reaches COMPLETED or FAILED.
  - `result`: String.
- **Methods**:
  - None (Pure State Object).

## 3. Services & Interfaces (Infrastructure Layer)

This layer handles the "How" of execution, keeping the Domain Objects (The "What") pure.

### **IExecutionEnvironment** (Interface)
- **Purpose**: Abstract interface for the isolation layer.
- **Methods**:
  - `runCommand(image: String, script: String, env: Map, args: Map) -> ExecutionResult`
    - `ExecutionResult`: `{ stdout, stderr, exitCode, duration }`

### **IScriptRunner** (Interface)
- **Purpose**: Abstract interface for running Tools and Hooks.
- **Methods**:
  - `runTool(tool: Tool, env: Environment) -> ToolResult`
  - `runHook(script: Script, context: Context) -> Void`

### **ExperimentOrchestrator** (Service)
- **Purpose**: The "Engine" that drives the experiment. It owns the `EventBus` and manages the lifecycle.
- **Dependencies**:
  - `experiment`: The Experiment State Object (Mutable).
  - `plan`: The ExperimentPlan (ReadOnly).
  - `executionEnv`: `IExecutionEnvironment` (e.g., DockerPool).
  - `eventBus`: `EventBus`.
- **Methods**:
  - `start()`: Starts the efficient event loop.
  - `processStep()`: Executes the logic for a single step.
  - `emit(event, payload)`: Emits lifecycle events.

#### Logger

- Purpose: Listens to the EventBus and persists logs to the database.
- Members:
  - `experiment`: (Reference)
- Methods:
  - `constructor(eventBus)`: Subscribes to `LOG` and other lifecycle events (e.g., `STEP_START` to log start automatically).
  - `onLog(payload)`: Internal handler.

#### **LogEntry**

- **Purpose**: Immutable record of events.
- **Members**:
  - `experimentId`: Reference.
  - `stepNumber`: Integer.
  - `timestamp`: Timestamp.
  - `source`: String (System, RoleName, ToolName).
  - `message`: String.
  - `data`: JSON (Optional snapshot of relevant state).

## 4. Class Diagram (Mermaid)

```mermaid
classDiagram
    class ExperimentPlan {
        +String name
        +String description
        +List~Role~ roles
        +Environment initialEnvironment
        +List~Goal~ goals
        +List~Script~ scripts
        +int maxSteps
    }

    class Experiment {
        +String id
        +ExperimentPlan plan
        +Environment currentEnvironment
        +int currentStep
        +Date startTime
        +Date endTime
        +Status status
        +Logger logger
    }
    class ExperimentOrchestrator {
        +start()
        +processStep()
        +emit()
    }
    class IExecutionEnvironment {
        <<interface>>
        +runCommand()
    }

    class Provider {
        +String name
        +String type
        +String baseUrl
        +String apiKey
        +isValid()
        +isModelReady(modelName)
        +listModels()
        +chat(modelName, history, tools, config)
    }

    class ModelConfig {
        +Provider provider
        +String modelName
        +JSON config
        +isValid()
        +chat(history, tools)
    }

    class IProvider {
        <<interface>>
        +isValid()
        +isModelReady(modelName)
        +listModels()
        +chat(modelName, history, tools, config)
    }

    class Tool {
        +String name
        +ModelConfig model
        +String systemPrompt
        +List~Tool~ tools
        +List~String~ variableWhitelist
        +constructPrompt(env)
    }

    class Tool {
        +String name
        +String namespace
        +String code
        +JSONSchema parameters
        +execute(env, args)
    }

    class Environment {
        +Map~String, Any~ variables
        +Map~String, String~ variableTypes
        +get(key)
        +set(key, val)
        +deepCopy()
        +toJSON()
    }

    class Goal {
        +String description
        +String conditionScript
        +evaluate(env)
    }

    class Script {
        +HookType type
        +String code
        +run(context)
    }

    class EventBus {
        +emit(type, payload)
        +on(type, callback)
    }

    class LogEntry {
        +String experimentId
        +int step
        +Date timestamp
        +String source
        +String message
        +JSON data
    }

    class Logger {
        +List~LogEntry~ entries
        +log(source, msg, env)
        +size()
    }

    ExperimentPlan "1" *-- "many" Role
    ExperimentPlan "1" *-- "1" Environment
    ExperimentPlan "1" *-- "many" Goal
    ExperimentPlan "1" *-- "many" Script
    Experiment "1" -- "1" ExperimentPlan : instantiated from
    Experiment "1" *-- "1" Environment : current state
    
    ExperimentOrchestrator --> Experiment : manages state
    ExperimentOrchestrator "1" *-- "1" EventBus : owns
    ExperimentOrchestrator --> IExecutionEnvironment : uses
    
    Logger "1" ..> EventBus : subscribes
    Script "1" ..> EventBus : subscribes
    Experiment "1" *-- "1" Logger
    Logger "1" *-- "many" LogEntry
    Role "1" --> "1" ModelConfig : has
    ModelConfig "1" --> "1" Provider : uses
    Role "1" --> "many" Tool : uses
    Role ..> Environment : reads (filtered)
    Tool ..> Environment : modifies
    Goal ..> Environment : reads
```

## 5. MongoDB Database Schemas

**Top-Level Collections**: `Tools`, `ExperimentPlans`, `Experiments`, `Logs`.

### Indexes
- **Logs**: `{ experimentId: 1, stepNumber: 1 }` (Compound), `{ timestamp: -1 }` (TTL optional).
- **Experiments**: `{ status: 1 }`, `{ planId: 1 }`.
- **Tools**: `{ namespace: 1, name: 1 }` (Unique).


### Tool Schema

```javascript
{
  _id: ObjectId,
  namespace: String,
  name: String,
  description: String,
  parameters: Object, // JSON Schema
  code: String,
  createdAt: Date,
  updatedAt: Date
}
```

### ExperimentPlan Schema

```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  initialEnvironment: Object, // Map of kv pairs
  roles: [{
    name: String,
    modelConfig: {
        provider: String,
        modelName: String,
        temperature: Number
    },
    systemPrompt: String,
    tools: [ObjectId], // References to Tool collection
    variableWhitelist: [String] // Array of variable keys
  }],
  goals: [{
    description: String,
    conditionScript: String
  }],
  scripts: [{
    hook: String, // 'StepStart', etc.
    code: String
  }],
  maxSteps: Number,
  createdAt: Date
}
```

### Experiment Schema

```javascript
{
  _id: ObjectId,
  planId: ObjectId, // Ref to ExperimentPlan
  status: String, // 'RUNNING', 'COMPLETED', etc.
  currentStep: Number,
  currentEnvironment: Object,
  startTime: Date,
  endTime: Date,
  result: String, // 'GoalMet', 'MaxStepsExceeded', etc.
}
```

### Log Schema

```javascript
{
  _id: ObjectId,
  experimentId: ObjectId, // Indexed
  stepNumber: Number,
  timestamp: Date,
  source: String,
  message: String,
  message: String,
  data: Object // Mixed type
}
// Indexes: { experimentId: 1, stepNumber: 1 }, { timestamp: -1 }
```

## 5. RESTful API Endpoints

### Tools

- `GET /api/tools` - List all tools.
  - Query Params: `?namespace=my_namespace` (Exact match).
- `GET /api/tools/:id` - Get tool details.
- `POST /api/tools` - Create a new tool.
- `PUT /api/tools/:id` - Update a tool.
- `DELETE /api/tools/:id` - Delete a tool.

### Experiment Plans

- `GET /api/plans` - List all plans.
- `GET /api/plans/:id` - Get plan details.
- `POST /api/plans` - Create a new plan.
- `PUT /api/plans/:id` - Update a plan.
- `DELETE /api/plans/:id` - Delete a plan.
- `POST /api/plans/:id/duplicate` - Clone a plan.
  - Body: `{ name: "New Plan Name" }` (Required).

### Experiments (Execution)

- `POST /api/experiments` - Launch a new experiment from a plan ID.
  - Body: `{ planId: "..." }`
- `GET /api/experiments` - List active/past experiments.
- `GET /api/experiments/:id` - Get experiment status and current state.
- `POST /api/experiments/:id/control` - Send commands.
  - Body: `{ command: "pause" | "resume" | "stop" }`
- `GET /api/experiments/:id/logs` - Get logs for an experiment.
- `GET /api/experiments/:id/stream` - SSE (Server-Sent Events) for real-time updates.

### System
- `GET /api/health` - Check system health and connectivity.
  - Response:
    ```json
    {
      "status": "ok", // or "error"
      "database": "connected",
      "providers": [
        { "name": "Ollama Local", "status": "ok" },
        { "name": "OpenAI", "status": "error", "message": "Invalid API Key" }
      ]
    }
    ```

## 6. User Interface (Angular)

### UI Layout

- **Sidebar**: Navigation (Dashboard, Plans, Tools, Active Experiments, Archive).
- **Header**: Global status, Settings (API Keys).

### Screens

1. **Dashboard**
    - Summary capabilities: Active experiments count, recent plans, system health.
      - Health includes successful connections to:
        - Backend API server (via basic HTTP check)
        - Backend Database (via `/api/health`)
        - All configured Providers (via `/api/health`)
      - UI Periodically polls `/api/health` (every 30s) to update status indicators.
    - "Quick Start" button.

2. **Tool Editor**
    - List view of tools.
    - Code editor: Monaco Editor with Python syntax highlighting and basic linting.
    - Parameter definition UI (Visual or JSON with Schema validation).

3. **Plan Designer**
    - **General**: Name, Description, Max Steps.
    - **Environment**: Key-Value table for initial variables.
    - **Roles**: Accordion list.
        - Role Detail: System Prompt text area, Model dropdown, Tool selector
          (multi-select), Variable Whitelist (multi-select).
    - **Workflow**:
        - Goals: List of condition scripts.
        - Hooks: Javascript/Python editor for defining hooks.
    - **Drag-and-Drop**: (Future) Visual flow builder.

4. **Experiment Monitor (The "Scientist" View)**
    - **Header**: Experiment Name, Status badge, Step counter, Controls (Pause/Stop).
    - **Layout**:
        - **Left Panel**: Live Log Feed (autoscrolling).
        - **Center Panel**: Role Activity (Current prompt, thinking process,
          tool output).
        - **Right Panel**: Environment Inspector (Live JSON tree view of variables).
    - **Visuals**: Progress bar for step execution.

### 6.2 UI Guidelines
- **Responsiveness**: The application must be fully responsive, supporting desktop and tablet viewports.
- **Accessibility**: All components must support keyboard navigation and include ARIA labels where appropriate.
- **Validation**: Forms must provide real-time feedback (e.g., invalid JSON, missing required fields) before submission.

### 6.3 Workflows

#### Creating an Experiment Plan

1. User goes to "Plans" -> "New Plan".
2. Defines the "Initial Environment" (e.g., `money: 100`, `market_status: "OPEN"`).
3. Adds a Role "Trader".
    - Selects Model (Ollama/Llama3).
    - Writes System Prompt.
    - Selects Tools (`buy_stock`, `sell_stock`).
    - Selects Whitelisted Variables (`money`, `market_status` - hides `admin_flags`).
4. Adds a Goal.
    - Condition: `env.money > 1000`.
5. Saves Plan.

#### Running and Monitoring

1. User selects the saved Plan and clicks "Run".
2. System creates an Experiment Instance and redirects to "Experiment Monitor".
3. User watches logs stream in via SSE.
4. User sees "Trader" role thinking...
5. User pauses experiment to inspect a specific variable state.
6. User resumes.
7. Experiment terminates when Goal is reached.

## 7. Technology Stack Details

- **Frontend**:
  - Angular 17+ (Standalone components).
  - TailwindCSS for styling.
  - `ngx-monaco-editor` for code editing.
  - Mermaid.js for visualization (optional).

- **Backend**:
  - Node.js (v20+).
  - Express.js.
  - Mongoose (ODM).
  - `python-shell` or `execa` for running Python scripts.
  - `dockerode` for managing Docker containers.
  - `ollama-js` or direct fetch for LLM communication.

- **Database**:
  - MongoDB (v6+).

- **Python Environment**:
  - Virtual environment (`venv`).


## 8. Non-Functional Requirements & Security

### 8.1 Security
- **Sandboxing**:
  - **Requirement**: All user-defined code (Tools, Scripts) MUST run in isolated containers (Docker) to prevent host compromise.
  - **Implementation**: The Execution Engine will interface with the Docker Daemon to spawn ephemeral containers for each step or tool execution.
  - **Limits**: Containers effectively limit CPU, Memory, and Network access.
- **Authentication & Authorization**:
  - **Method**: JSON Web Tokens (JWT).
  - **Policy**: All API endpoints (except `/api/health` and `/api/auth/login`) require a valid Bearer token.
  - **Roles**: Initially Single-User (Admin), but designed for RBAC (Admin, Editor, Viewer) in future.
- **Secrets Management**:
  - **storage**: API Keys and sensitive credentials must NOT be stored in plaintext. They should be encrypted at rest using AES-256 or delegating to a Secret Manager (e.g. Vault, AWS Secrets Manager).
- **Network**:
  - **Transport**: HTTPS is mandatory for all API traffic.
- **Input Validation**:
  - **Middleware**: All API endpoints must enforce strict schema validation (using Joi or Zod) on request bodies.
  - **Sanitization**: Inputs intended for Python execution must be sanitized to prevent injection, though Docker provides the primary defense.

### 8.2 Error Handling & Resilience

- **Tool Failures**: If a Python tool script crashes or returns a non-zero exit
  code, the Experiment Step should catch this.
  - Configurable policy: `ABORT_EXPERIMENT` or `CONTINUE_WITH_ERROR` (logging
    the failure).
- **LLM Failures**: Network timeouts or API errors from Ollama/Providers should
  trigger a retry mechanism (exponential backoff) before failing the step.
- **Infinite Loops**: `maxSteps` in ExperimentPlan enforces a hard stop.
- **Orphaned Processes**: The Execution Engine must ensure all spawned Python
  subprocesses are killed if the Node.js parent process terminates.

## 9. Future Security Roadmap
- **Multi-tenancy**: Namespace isolation for different users.
- **Audit Logging**: Immutable audit trails for all sensitive actions.

## 11. Configuration & Deployment

### 11.1 Backend Configuration
The backend is configured via environment variables (typically in a `.env` file).

- `PORT`: Port to listen on (default: 3000).
- `MONGO_URI`: Connection string for MongoDB (e.g., `mongodb://localhost:27017/scientist-ai` or a remote Atlas URL).
- `API_BASE_URL`: Base URL for the API (used for self-referencing if needed).
- `LOG_LEVEL`: Logging verbosity (DEBUG, INFO, WARN, ERROR).
- `PROVIDER_CONFIG_PATH`: (Optional) Path to a JSON file pre-seeding provider configurations.

### 11.2 Frontend Configuration
The Angular application uses `environment.ts` (dev) and `environment.prod.ts` (production) for build-time configuration, and a runtime `config.json` for deployment flexibility.

- `apiUrl`: URL of the backend API.
  - In development: `http://localhost:3000/api`
  - In production: Loaded from `assets/config.json` to allow the same build artifact to point to different backends (e.g., Docker container linking).

### 11.3 Health Checks
Logic for verifying connectivity resides in the Backend.
- **Database**: The Backend maintains an open connection pool to MongoDB and reports connection status.
- **Providers**: The Backend periodically (or on-demand via `/api/health`) attempts to list models or ping the configured LLM providers to verify reachability and authentication.

## 10. Testing Plan

### 10.1 Strategy Overview

The testing strategy covers the entire stack, ensuring reliability from
individual components to full system integration.

### 10.2 Frontend (Angular)

- **Unit & Component Testing**:
  - **Framework**: Jasmine + Karma (Angular default).
  - **Scope**:
    - Services: Mock external dependencies (API services) to test logic in isolation.
    - Components: Test rendering, input/output bindings, and event handling.
- **Integration Testing**:
  - **Framework**: Use `HtmlFixture` in Jasmine to test component interaction
    with child components.
- **End-to-End (E2E) Testing**:
  - **Framework**: Cypress (preferred over Protractor).
  - **Scope**: Critical user flows:
    - Creating a Tool.
    - Building an ExperimentPlan.
    - Running an Experiment and observing the log stream.

### 10.3 Backend (Node.js/Express)

- **Unit Testing**:
  - **Framework**: Jest.
  - **Scope**: Control logic, utility functions, and data transformation helpers.
- **API Integration Testing**:
  - **Framework**: Jest + Supertest.
  - **Scope**: Test all REST endpoints (`GET`, `POST`, `PUT`, `DELETE`).
  - **Database**: Use `mongodb-memory-server` to spin up an ephemeral in-memory
    MongoDB instance for each test suite, ensuring clean measuring and no
    side effects.

### 10.4 Python Execution Engine

- **Unit Testing**:
  - **Framework**: Pytest.
  - **Scope**:
    - **Standard Library Tools**: Verify each built-in tool performs as expected
      (mocking external API calls where necessary).
    - **Script Hooks**: Verify hook logic triggers correctly.
- **Integration Testing**:
  - **Framework**: Pytest.
  - **Scope**: Test the interface between the Python scripts and the Mock
    Environment object to ensure state is read/modified correctly.

### 10.5 System Integration
- **Node-Python Bridge**:
  - Create specific tests that spawn the Python subprocess with a known payload and verify the JSON output is parsed correctly by Node.js.
  - Test error handling: e.g., Python script crashing, syntax errors in user-defined tools.

### 10.6 Security & Container Testing
- **Static Analysis**: Run `bandit` on all built-in Python tools to check for vulnerabilities.
- **Container Isolation**:
  - Verify Docker containers spawn with correct CPU/Memory limits.
  - Verify network restrictions prevents containers from accessing restricted hosts.
  - Attempt "jailbreak" scripts in test suite to ensure sandboxing holds.


## 12. Execution Engine & Step Lifecycle

The **Execution Engine** (implemented via `ExperimentOrchestrator`) is the core service that drives the experiment. It is completely decoupled from the `Experiment` state object.

### 12.1 Overview
- **Orchestrator**: Maintains the event loop.
- **State**: `Experiment` object acts as the "Memory" or "Register".
- **Events**: The Orchestrator emits events via `EventBus`.
- **Execution**: The Orchestrator uses `IExecutionEnvironment` to actually run code.

### 12.2 Lifecycle Phases

#### Phase 1: Initialization
1.  **Instantiation**: An `Experiment` record is created in MongoDB based on the `ExperimentPlan`.
2.  **State Population**: The `initialEnvironment` from the plan is copied into the `Experiment.currentEnvironment`.
3.  **Script Registration**: The engine loads all Scripts defined in the plan and registers them as listeners on the `EventBus`.
4.  **Logging**: The Logger subscribes to the `EventBus`.
5.  **Start Event**: Engine emits `EXPERIMENT_START`.
    *   *Effect*: `EXPERIMENT_START` hooks run. Logger logs "Experiment Initialized".
6.  **Status Update**: Status transitions to `RUNNING`.

#### Phase 2: The Step Loop
The core loop repeats until a termination condition is met.

1.  **Step Start**: Emit `STEP_START`.
    *   *Effect*: `STEP_START` hooks run. Logger logs "Step N Started".
3.  **Role Iteration**: Iterate through each `Role` in the ordered list defined in the plan.
    *   **Prompt Construction**:
        *   The Engine creates a deep copy of the `currentEnvironment`.
        *   It filters this copy based on the Role's `variableWhitelist`.
        *   It constructs a System Message using the Role's `systemPrompt`.
        *   It appends a User Message containing the current step number and specific instructions (e.g., "Analyze the environment and take action.").
    *   **Before Prompt**: Emit `MODEL_PROMPT` (Mutable payload allows Hooks to modify messages).
    *   **Inference**:
        *   Send Prompt to Provider.
        *   Emit `MODEL_RESPONSE_CHUNK` events during streaming.
    *   **Tool Execution (If requested)**:
        *   If the Model requests a Tool Call:
            *   Emit `TOOL_CALL`.
            *   **Execution**: Spawn Docker container.
            *   **State Update**: Merge changes.
            *   Emit `TOOL_RESULT`.
            *   **Feedback**: Append to history.
    *   **After Response**: Emit `MODEL_RESPONSE_COMPLETE`.
4.  **Step End**: Emit `STEP_END`.
5.  **Goal Evaluation**:
    *   Iterate through all `Goals`.
    *   Execute the `conditionScript` for each using the current Environment.
    *   If any returns `True`:
        *   Set `Experiment.result` to the Goal's description.
        *   *Log*: "Goal Met: [Goal Description]".
        *   Break the loop.
6.  **Safety Check**: Increment `currentStep`. If `currentStep > maxSteps`, set result to "Max Steps Exceeded" and break.

#### Phase 3: Termination
1.  **Status Update**: Set status to `COMPLETED` (or `FAILED` if critical error).
2.  **End Event**: Emit `EXPERIMENT_END`.
3.  **Cleanup**: Close database connections (if dedicated), clean up any temp files.

### 12.4 Container Lifecycle & Security (Execute-and-Destroy)

To ensure maximum security and performance, the system employs a "Warm Pool" strategy.

1.  **Warm Pool**:
    *   The `ContainerPool` maintains a configurable number (default: 2) of idle, pre-warmed Docker containers (Status: `READY`).
    *   These containers are started with network restrictions and resource limits applied at boot.

2.  **Acquisition (Hot)**:
    *   When the Engine needs to execute a Tool, it requests a container from the pool.
    *   The pool returns a `READY` container immediately and marks it `BUSY`.
    *   *Async*: The pool immediately spawns a new container to replace the leased one (Replenishment).

3.  **Execution**:
    *   The Tool code and arguments are injected into the `BUSY` container.
    *   The command is executed. Standard Output/Error is captured.

4.  **Destruction**:
    *   Once execution completes (success or failure), the container is **Terminated**.
    *   It is NOT returned to the pool. This "One-Shot" policy prevents side-effects from one tool call affecting subsequent calls (e.g., leftover files, modified environment variables).


```mermaid
flowchart TD
    Start([Start Step]) --> StepStartEvt{{Emit STEP_START}}
    StepStartEvt --> RoleLoop{Roles Remaining?}
    
    RoleLoop -- Yes --> GetRole[Get Next Role]
    GetRole --> FilterEnv[Filter Environment]
    GetRole --> RoleStartEvt{{Emit ROLE_START}}
    RoleStartEvt --> BuildPrompt[Build Prompt]
    BuildPrompt --> PromptEvt{{Emit MODEL_PROMPT}}
    PromptEvt --> Inference[Model Inference]
    
    Inference --> ChunkEvt{{Emit MODEL_RESPONSE_CHUNK}}
    ChunkEvt --> ToolCheck{Tool Called?}
    
    ToolCheck -- Yes --> ToolCallEvt{{Emit TOOL_CALL}}
    ToolCallEvt --> ExecTool[Execute Tool Docker]
    ExecTool --> UpdateEnv[Update Environment]
    UpdateEnv --> ToolResultEvt{{Emit TOOL_RESULT}}
    ToolResultEvt --> AppendHistory[Append Tool Output to History]
    AppendHistory --> Inference
    
    ToolCheck -- No --> ResponseCompleteEvt{{Emit MODEL_RESPONSE_COMPLETE}}
    ResponseCompleteEvt --> RoleLoop
    
    RoleLoop -- No --> StepEndEvt{{Emit STEP_END}}
    StepEndEvt --> GoalCheck{Any Goal Met?}
    
    GoalCheck -- Yes --> SetResult[Set Result]
    SetResult --> ExpEndEvt{{Emit EXPERIMENT_END}}
    ExpEndEvt --> Completed([Experiment Completed])
    
    GoalCheck -- No --> MaxStepCheck{Max Steps Reached?}
    MaxStepCheck -- Yes --> SetMaxResult[Set Result: Max Steps]
    SetMaxResult --> ExpEndEvt
    
    MaxStepCheck -- No --> IncStep[Increment Step]
    IncStep --> Start
```
