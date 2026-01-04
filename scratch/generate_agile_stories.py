import os

stories = [
    {
        "id": "001",
        "name": "project_initialization",
        "title": "Initialize Project Structure",
        "points": 1,
        "type": "Chore",
        "description": "Initialize the Git repository and set up the basic directory structure for the MEAN stack application, including the Angular frontend and Node.js backend.",
        "user_story": "**As a** Developer,\n**I want** a clean project structure,\n**So that** I can begin implementing features without directory confusion.",
        "acceptance_criteria": [
            "Angular CLI project initialized in `frontend/`.",
            "Node.js Express project initialized in `backend/`.",
            "Root level `package.json` for orchestration (optional) or clear instructions.",
            "Git repository initialized with appropriate `.gitignore`."
        ],
        "testing": [
            "Run `npm install` in backend and frontend.",
            "Verify directory structure matches standard MEAN layout."
        ]
    },
    {
        "id": "002",
        "name": "setup_database_connection",
        "title": "Setup MongoDB Connection",
        "points": 1,
        "type": "Feature",
        "description": "Configure Mongoose to connect to the MongoDB database using environment variables.",
        "user_story": "**As a** System,\n**I want** to connect to the Database,\n**So that** I can store and persist data.",
        "acceptance_criteria": [
            "Mongoose connected to `MONGO_URI` from `.env`.",
            "Connection events (connected, error) are logged.",
            "Application fails gracefully if DB is not reachable on startup."
        ],
        "testing": [
            "Start the server with a valid MONGO_URI.",
            "Verify 'Connected to MongoDB' log message.",
            "Start with invalid URI and verify error handling."
        ]
    },
    {
        "id": "003",
        "name": "backend_error_handling",
        "title": "Implement Global Error Handling",
        "points": 2,
        "type": "Feature",
        "description": "Implement a centralized error handling middleware for the Express application to ensure consistent API error responses.",
        "user_story": "**As a** API Consumer,\n**I want** consistent error messages,\n**So that** I can handle failures gracefully.",
        "acceptance_criteria": [
            "Middleware captures unhandled exceptions.",
            "Standard JSON error format: `{ error: true, message: '...' }`.",
            "HTTP Status codes are respected (400, 404, 500)."
        ],
        "testing": [
            "Trigger a 404.",
            "Trigger a 500 exception.",
            "Verify JSON response format."
        ]
    },
    {
        "id": "004",
        "name": "tool_model_schema",
        "title": "Create Tool Mongoose Model",
        "points": 1,
        "type": "Feature",
        "description": "Define the Mongoose schema for 'Tools', including fields for namespace, name, description, parameters, and code.",
        "user_story": "**As a** Developer,\n**I want** a database model for Tools,\n**So that** I can save tool definitions.",
        "acceptance_criteria": [
            "Schema includes: namespace, name, description, parameters, code.",
            "Unique index on `{ namespace: 1, name: 1 }`.",
            "Timestamps (createdAt, updatedAt) enabled."
        ],
        "testing": [
            "Create a valid Tool document in mongo shell or test script.",
            "Attempt to create a duplicate Tool (expect error)."
        ]
    },
    {
        "id": "005",
        "name": "api_create_tool",
        "title": "Implement Create Tool API",
        "points": 2,
        "type": "Feature",
        "description": "Implement the POST /api/tools endpoint to create new tools.",
        "user_story": "**As a** User,\n**I want** to register a new Tool,\n**So that** I can use it in experiments.",
        "acceptance_criteria": [
            "POST /api/tools accepts JSON body.",
            "Validates required fields.",
            "Saves to DB.",
            "Returns 201 Created and the created object."
        ],
        "testing": [
            "POST valid tool data.",
            "POST invalid data (missing name).",
            "Verify persistence in DB."
        ]
    },
    {
        "id": "006",
        "name": "api_list_tools",
        "title": "Implement List Tools API",
        "points": 2,
        "type": "Feature",
        "description": "Implement the GET /api/tools endpoint to retrieve available tools, with optional filtering.",
        "user_story": "**As a** User,\n**I want** to see all available tools,\n**So that** I can choose which ones to use.",
        "acceptance_criteria": [
            "GET /api/tools returns an array of tools.",
            "Supports query param `?namespace=X` to filter.",
            "Returns 200 OK."
        ],
        "testing": [
            "Seed DB with tools.",
            "Call GET /api/tools.",
            "Call GET /api/tools?namespace=default."
        ]
    },
    {
        "id": "007",
        "name": "api_get_tool",
        "title": "Implement Get Tool Details API",
        "points": 1,
        "type": "Feature",
        "description": "Implement GET /api/tools/:id to retrieve a specific tool.",
        "user_story": "**As a** User,\n**I want** to view tool details,\n**So that** I can check its code and parameters.",
        "acceptance_criteria": [
            "GET /api/tools/:id returns simple object.",
            "Returns 404 if not found."
        ],
        "testing": [
            "Get existing ID.",
            "Get non-existing ID."
        ]
    },
    {
        "id": "008",
        "name": "api_update_tool",
        "title": "Implement Update Tool API",
        "points": 2,
        "type": "Feature",
        "description": "Implement PUT /api/tools/:id to update an existing tool.",
        "user_story": "**As a** User,\n**I want** to edit a tool,\n**So that** I can fix bugs or improve it.",
        "acceptance_criteria": [
            "PUT /api/tools/:id updates fields.",
            "Returns updated object.",
            "Respects unique constraints (name/namespace collision)."
        ],
        "testing": [
            "Update a tool's code.",
            "Verify change in DB."
        ]
    },
    {
        "id": "009",
        "name": "api_delete_tool",
        "title": "Implement Delete Tool API",
        "points": 1,
        "type": "Feature",
        "description": "Implement DELETE /api/tools/:id.",
        "user_story": "**As a** User,\n**I want** to delete `Tools`,\n**So that** I can remove deprecated or unused tools.",
        "acceptance_criteria": [
            "DELETE /api/tools/:id removes the document.",
            "Returns 200 OK or 204 No Content."
        ],
        "testing": [
            "Delete a tool.",
            "Verify it is gone from DB."
        ]
    },
    {
        "id": "010",
        "name": "plan_model_schema",
        "title": "Create Experiment Plan Model",
        "points": 1,
        "type": "Feature",
        "description": "Define the Mongoose schema for `ExperimentPlan`, including roles, initial environment, goals, and scripts.",
        "user_story": "**As a** Developer,\n**I want** a schema for Experiment Plans,\n**So that** I can store complex experiment definitions.",
        "acceptance_criteria": [
            "Schema includes nested `roles`, `goals`, `scripts` arrays.",
            "Includes `initialEnvironment` map.",
            "Timestamps enabled."
        ],
        "testing": [
            "Create a complex plan in mongo shell."
        ]
    },
    {
        "id": "011",
        "name": "api_create_plan",
        "title": "Implement Create Plan API",
        "points": 2,
        "type": "Feature",
        "description": "Implement POST /api/plans.",
        "user_story": "**As a** User,\n**I want** to save my experiment design,\n**So that** I can run it later.",
        "acceptance_criteria": [
            "Validates nested structures (Roles, Goals).",
            "Saves to DB."
        ],
        "testing": [
            "POST a full plan JSON.",
            "Verify storage."
        ]
    },
    {
        "id": "012",
        "name": "api_list_plans",
        "title": "Implement List Plans API",
        "points": 2,
        "type": "Feature",
        "description": "Implement GET /api/plans.",
        "user_story": "**As a** User,\n**I want** to see my saved plans,\n**So that** I can select one to run.",
        "acceptance_criteria": [
            "Returns summary list (maybe minimal fields to save bandwidth).",
            "Pagination (optional for now)."
        ],
        "testing": [
            "Call GET /api/plans."
        ]
    },
    {
        "id": "013",
        "name": "api_get_plan",
        "title": "Implement Get Plan Details API",
        "points": 1,
        "type": "Feature",
        "description": "Implement GET /api/plans/:id.",
        "user_story": "**As a** User,\n**I want** to load a full plan,\n**So that** I can review or edit it.",
        "acceptance_criteria": [
            "Returns full document including all nested arrays.",
            "Populates external references (if any, e.g. tools)."
        ],
        "testing": [
            "Retrieve specific plan."
        ]
    },
    {
        "id": "014",
        "name": "api_update_plan",
        "title": "Implement Update Plan API",
        "points": 3,
        "type": "Feature",
        "description": "Implement PUT /api/plans/:id.",
        "user_story": "**As a** User,\n**I want** to edit a plan,\n**So that** I can refine my experiment.",
        "acceptance_criteria": [
            "Updates full structure."
        ],
        "testing": [
            "Modify a role in a plan.",
            "Put changes.",
            "Verify update."
        ]
    },
    {
        "id": "015",
        "name": "experiment_model_schema",
        "title": "Create Experiment Model",
        "points": 1,
        "type": "Feature",
        "description": "Define Mongoose schema for `Experiment` (runtime instance).",
        "user_story": "**As a** Developer,\n**I want** a schema for running experiments,\n**So that** I can track state and status.",
        "acceptance_criteria": [
            "References `planId`.",
            "Tracks `status` (INITIALIZING, RUNNING, COMPLETED).",
            "Stores `currentEnvironment` state."
        ],
        "testing": [
            "Create dummy experiment doc."
        ]
    },
    {
        "id": "016",
        "name": "log_model_schema",
        "title": "Create Log Entry Model",
        "points": 1,
        "type": "Feature",
        "description": "Define Mongoose schema for `LogEntry`.",
        "user_story": "**As a** Developer,\n**I want** a structured log format,\n**So that** I can debug experiments post-mortem.",
        "acceptance_criteria": [
            "Fields: `experimentId`, `stepNumber`, `source`, `message`, `data`.",
            "Index on `experimentId`."
        ],
        "testing": [
            "Create a log entry."
        ]
    },
    {
        "id": "017",
        "name": "api_launch_experiment",
        "title": "Implement Launch Experiment API",
        "points": 3,
        "type": "Feature",
        "description": "Implement POST /api/experiments to spawn a new instance from a Plan.",
        "user_story": "**As a** User,\n**I want** to run a plan,\n**So that** I can start an experiment.",
        "acceptance_criteria": [
            "Accepts `planId`.",
            "Creates `Experiment` document.",
            "Copies `initialEnvironment` to `currentEnvironment`.",
            "Sets status to `INITIALIZING`.",
            "Returns experiment ID."
        ],
        "testing": [
            "Post planId.",
            "Verify new Experiment doc created."
        ]
    },
    {
        "id": "018",
        "name": "event_bus_system",
        "title": "Implement Internal Event Bus",
        "points": 3,
        "type": "Feature",
        "description": "Create the `EventBus` class extending Node.js EventEmitter, with typed events.",
        "user_story": "**As a** Developer,\n**I want** a central event bus,\n**So that** I can decouple execution logic from side effects.",
        "acceptance_criteria": [
            "Supports `emit` and `on`.",
            "Defines string constants for all event types (STEP_START, LOG, etc)."
        ],
        "testing": [
            "Unit test: Create bus, subscribe, emit, verify callback."
        ]
    },
    {
        "id": "019",
        "name": "logger_service",
        "title": "Implement Persistent Logger Service",
        "points": 3,
        "type": "Feature",
        "description": "Create a service that subscribes to the EventBus and writes logs to MongoDB.",
        "user_story": "**As a** User,\n**I want** activities to be logged automatically,\n**So that** I don't lose history.",
        "acceptance_criteria": [
            "Subscribes to `LOG` event.",
            "Subscribes to lifecycle events (STEP_START, etc) and auto-generates logs.",
            " writes `LogEntry` to DB."
        ],
        "testing": [
            "Emit event on bus.",
            "Check for new document in `logs` collection."
        ]
    },
    {
        "id": "020",
        "name": "container_pool_manager",
        "title": "Implement Docker Container Pool",
        "points": 8,
        "type": "Feature",
        "description": "Implement `ContainerPool` to manage a pool of warm Docker containers using `dockerode`.",
        "user_story": "**As a** System,\n**I want** pre-warmed containers,\n**So that** generic tool execution is fast.",
        "acceptance_criteria": [
            "Configurable pool size.",
            "`acquire()` returns a ready container.",
            "Replenishes pool asynchronously.",
            "Containers have restricted network/resources."
        ],
        "testing": [
            "Unit test with mock Dockerode (or real one if available).",
            "Verify pool maintains size."
        ]
    },
    {
        "id": "021",
        "name": "container_execution_wrapper",
        "title": "Implement Container Execution Wrapper",
        "points": 5,
        "type": "Feature",
        "description": "Implement the `Container` class that wraps a Docker container and provides an `execute(script)` method.",
        "user_story": "**As a** System,\n**I want** to run python scripts in Docker,\n**So that** they are sandboxed.",
        "acceptance_criteria": [
            "`execute` accepts python code.",
            "Writes code to temp file in container or pipes to stdin.",
            "Captures stdout/stderr.",
            "Returns execution result object."
        ],
        "testing": [
            "Execute `print('hello')` in a container.",
            "Verify output."
        ]
    },
    {
        "id": "022",
        "name": "llm_provider_interface",
        "title": "Implement LLM Provider Abstraction",
        "points": 3,
        "type": "Feature",
        "description": "Create the `Provider` abstract base class and `ModelConfig` logic.",
        "user_story": "**As a** Developer,\n**I want** to swap LLM providers,\n**So that** I'm not locked into one vendor.",
        "acceptance_criteria": [
            "Defined interface methods: `chat`, `listModels`.",
            "ModelConfig validation logic."
        ],
        "testing": [
            "Unit test interface classes."
        ]
    },
    {
        "id": "023",
        "name": "ollama_integration",
        "title": "Implement Ollama Provider",
        "points": 3,
        "type": "Feature",
        "description": "Implement the `OllamaProvider` class to communicate with a local Ollama instance.",
        "user_story": "**As a** User,\n**I want** to use local models,\n**So that** I don't incur API costs.",
        "acceptance_criteria": [
            "Connects to Ollama API URL.",
            "Implements `chat` with streaming support.",
            "Implements `listModels`."
        ],
        "testing": [
            "Mock Ollama API response.",
            "Verify chat completion parsing."
        ]
    },
    {
        "id": "024",
        "name": "orchestrator_initialization",
        "title": "Implement Experiment Orchestrator Initialization",
        "points": 5,
        "type": "Feature",
        "description": "Implement the startup phase of `ExperimentOrchestrator`: loading the plan, setting up the bus, and emitting start events.",
        "user_story": "**As a** System,\n**I want** to initialize experiments correctly,\n**So that** all components are ready before the first step.",
        "acceptance_criteria": [
            "Loads Experiment and Plan from DB.",
            "Instantiates EventBus.",
            "Emits `EXPERIMENT_START`."
        ],
        "testing": [
            "Call `start()`.",
            "Verify events emitted."
        ]
    },
    {
        "id": "025",
        "name": "orchestrator_step_loop",
        "title": "Implement Experiment Step Loop",
        "points": 8,
        "type": "Feature",
        "description": "Implement the main loop of the orchestrator: Step Start -> Role Iteration -> Goal Check -> Step End.",
        "user_story": "**As a** User,\n**I want** the experiment to proceed in steps,\n**So that** agents can interact sequentially.",
        "acceptance_criteria": [
            "Loop increments `currentStep`.",
            "Respects `maxSteps`.",
            "Calls `processStep()` repeatedly."
        ],
        "testing": [
            "Run a dummy loop with 0 roles.",
            "Verify step counter increments."
        ]
    },
    {
        "id": "026",
        "name": "role_prompt_construction",
        "title": "Implement Role Prompt Construction",
        "points": 5,
        "type": "Feature",
        "description": "Implement logic to build the context window for a Role, including System Prompt, History, and filtered Environment variables.",
        "user_story": "**As a** System,\n**I want** to construct accurate prompts,\n**So that** the LLM has the necessary context.",
        "acceptance_criteria": [
            "Injects System Prompt.",
            "Injects Whitelisted Variables (JSON).",
            "Formats conversation history."
        ],
        "testing": [
            "Unit test with dummy environment and key whitelist."
        ]
    },
    {
        "id": "027",
        "name": "tool_execution_logic",
        "title": "Implement Tool Execution Logic",
        "points": 5,
        "type": "Feature",
        "description": "Implement the logic to handle a `TOOL_CALL` event: acquire container, run code, parse result, update environment.",
        "user_story": "**As a** Agent,\n**I want** my tool calls to actually do things,\n**So that** I can affect the environment.",
        "acceptance_criteria": [
            "Detects tool call from LLM response.",
            "Executes tool in container.",
            "Updates `Variables` map with result."
        ],
        "testing": [
            "Simulate a tool call event.",
            "Verify container invocation."
        ]
    },
    {
        "id": "028",
        "name": "goal_evaluation_logic",
        "title": "Implement Goal Evaluation Logic",
        "points": 3,
        "type": "Feature",
        "description": "Implement logic to evaluate Goal conditions (Python expressions) against the current environment.",
        "user_story": "**As a** User,\n**I want** experiments to stop when goals are met,\n**So that** I typically get a successful result.",
        "acceptance_criteria": [
            "Evaluates boolean expression using Python (in container or safe eval).",
            "Updates Experiment result if True."
        ],
        "testing": [
            "Test with condition `money > 100` and changing variables."
        ]
    },
    {
        "id": "029",
        "name": "setup_frontend_layout",
        "title": "Setup Main Layout & Navigation",
        "points": 3,
        "type": "Feature",
        "description": "Create the main Angular shell with Sidebar and Header.",
        "user_story": "**As a** User,\n**I want** a navigation menu,\n**So that** I can move between features.",
        "acceptance_criteria": [
            "Sidebar with links (Dashboard, Plans, Tools, etc).",
            "Header with app title.",
            "Responsive design."
        ],
        "testing": [
            "Click all links.",
            "Verify routing works."
        ]
    },
    {
        "id": "030",
        "name": "ui_tool_list",
        "title": "Implement Tool List UI",
        "points": 2,
        "type": "Feature",
        "description": "Create the Tool List component.",
        "user_story": "**As a** User,\n**I want** to see my tools,\n**So that** I can manage them.",
        "acceptance_criteria": [
            "Fetches tools from API.",
            "Displays in table or grid.",
            "Filter by namespace."
        ],
        "testing": [
            "Load page.",
            "Verify list matches DB."
        ]
    },
    {
        "id": "031",
        "name": "ui_tool_editor",
        "title": "Implement Tool Editor UI",
        "points": 5,
        "type": "Feature",
        "description": "Create the Tool Editor component with Monaco Editor integration.",
        "user_story": "**As a** User,\n**I want** a code editor for tools,\n**So that** I can write python code easily.",
        "acceptance_criteria": [
            "Monaco Editor for `code` field.",
            "JSON editor for `parameters`.",
            "Save button calls API."
        ],
        "testing": [
            "Edit code.",
            "Save.",
            "Reload to verify persistence."
        ]
    },
    {
        "id": "032",
        "name": "ui_plan_list",
        "title": "Implement Plan List UI",
        "points": 2,
        "type": "Feature",
        "description": "Create Plan List component.",
        "user_story": "**As a** User,\n**I want** to list plans,\n**So that** I can find experiment templates.",
        "acceptance_criteria": [
            "Table view of plans.",
            "'New Plan' button."
        ],
        "testing": [
            "Verify list rendering."
        ]
    },
    {
        "id": "033",
        "name": "ui_plan_editor_basic",
        "title": "Implement Plan Basic Settings UI",
        "points": 3,
        "type": "Feature",
        "description": "Create the form for editing basic Plan metadata and Initial Environment.",
        "user_story": "**As a** User,\n**I want** to edit plan details,\n**So that** I can configure the starting state.",
        "acceptance_criteria": [
            "Name/Description inputs.",
            "Key-Value editor for Initial Environment."
        ],
        "testing": [
            "Change details.",
            "Save plan."
        ]
    },
    {
        "id": "034",
        "name": "ui_plan_editor_roles",
        "title": "Implement Plan Role Editor UI",
        "points": 5,
        "type": "Feature",
        "description": "Create a complex form component for adding/editing Roles within a Plan.",
        "user_story": "**As a** User,\n**I want** to define roles,\n**So that** I can assign agents to the experiment.",
        "acceptance_criteria": [
            "Add/Remove Role.",
            "Edit System Prompt.",
            "Select Model.",
            "Multi-select Tools."
        ],
        "testing": [
            "Add a role.",
            "Save.",
            "Verify integrity."
        ]
    },
    {
        "id": "035",
        "name": "ui_experiment_monitor",
        "title": "Implement Experiment Monitor View",
        "points": 8,
        "type": "Feature",
        "description": "Create the comprehensive 'Scientist' view for running experiments.",
        "user_story": "**As a** Scientist,\n**I want** a dashboard for the running experiment,\n**So that** I can see what's happening.",
        "acceptance_criteria": [
            "Shows current status/step.",
            "3-panel layout (Logs, Activity, Environment).",
            "Log feed component.",
            "JSON tree view for environment."
        ],
        "testing": [
            "Open an experiment ID.",
            "Verify layout loads."
        ]
    },
    {
        "id": "036",
        "name": "ui_realtime_logs",
        "title": "Implement Realtime Log Streaming",
        "points": 5,
        "type": "Feature",
        "description": "Connect the Experiment Monitor to the specialized SSE endpoint/logic to stream logs.",
        "user_story": "**As a** User,\n**I want** to see logs as they happen,\n**So that** I don't have to refresh.",
        "acceptance_criteria": [
            "Subscribes to log stream.",
            "Appends new logs to the feed.",
            "Autoscroll behavior."
        ],
        "testing": [
            "Run experiment.",
            "Watch logs appear."
        ]
    }
]

# Path to stories directory
stories_dir = "/home/andrew/Projects/Code/web/scientist-ai/planning/agile/stories"
backlog_path = "/home/andrew/Projects/Code/web/scientist-ai/planning/agile/backlog.md"

# 1. Create Story Files
for story in stories:
    filename = f"{story['id']}_{story['name']}.md"
    filepath = os.path.join(stories_dir, filename)
    
    content = f"""# {story['title']}

- **Status:** READY
- **Points:** {story['points']}
- **Story ID:** {story['id']}
- **Type:** {story['type']}

## Description
{story['description']}

## User Story
{story['user_story']}

## Acceptance Criteria
"""
    for ac in story['acceptance_criteria']:
        content += f"- [ ] {ac}\n"
    
    content += "\n## Testing\n"
    for i, test in enumerate(story['testing']):
        content += f"{i+1}. {test}\n"
    
    content += "\n## Review\n"
    
    with open(filepath, 'w') as f:
        f.write(content)

# 2. Append to Backlog
with open(backlog_path, 'r') as f:
    backlog_content = f.read()

# Only append if not already present (checking by ID roughly)
new_rows = ""
for story in stories:
    story_filename_base = f"{story['id']}_{story['name']}"
    if story_filename_base not in backlog_content:
        new_rows += f"| {story_filename_base:<50} | {story['points']:<6} | READY       |\n"

if new_rows:
    with open(backlog_path, 'a') as f:
        f.write(new_rows)

print(f"Generated {len(stories)} stories and updated backlog.")
