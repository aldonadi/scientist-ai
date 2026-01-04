# Front Matter

Model: **gpt-oss:20b**

Prompt:
> You are a software engineer design consultant. Analyze this software
> specification document being shown you by a customer. Your job it to
> evaluate whether this project is ready to carve up into user stories
> and discrete programming tasks yet. If it is, say so and give your
> recommendations for how to split the implementation (programming) phase
> into discrete tasks that can divvied out to programmers. If not, then
> list out what things you think still need to be hammered out before the
> project is ready to move to the programming phase.

# Content

Not yet ready for a task‑breakdown.  
The specification covers the main concepts, API surface, database schema, UI flow, and a high‑level execution model, but several critical pieces are missing or under‑defined.  Until those are resolved the project cannot be reliably split into user stories that guarantee a working, secure, and testable system.

**Missing / Uncertain Items**

| Area | Issue | Why it matters |
|------|-------|----------------|
| **Authentication / Authorization** | No login/register endpoints, JWT issuance, refresh logic, role definition, permission checks. | Without this the API is open; RBAC, audit, and multi‑tenant isolation cannot be enforced. |
| **Provider Configuration** | `PROVIDER_CONFIG_PATH` is optional; no schema or validation for provider configs, no UI to add/edit providers, no mechanism to store API keys securely. | The system must verify provider health, validate `modelName`, and securely store secrets. |
| **Error & Retry Policies** | LLM and tool failures are described qualitatively but no concrete retry limits, back‑off strategy, or error‑handling state machine. | Needed to avoid silent failures and to surface errors to the UI. |
| **Container Security** | Docker usage is described, but no runtime policy (capabilities, network isolation, file‑system mounts), no resource limits enforcement, no cleanup on process crash. | Critical for sandboxing user‑supplied Python code. |
| **Environment Variable Type Safety** | `Environment.set` enforces types, but no definition of how types are declared in a plan or UI, and no validation of values at runtime. | Without this, type errors could crash experiments. |
| **Goal & Script Language** | Condition scripts and hooks are stored as raw Python strings. No sandboxing, no compile‑time linting, no restrictions on allowed modules. | User‑supplied code could break the system or read/write files. |
| **Testing Strategy** | Test plans are outlined but no concrete test suites, coverage targets, or integration test scenarios are defined. | Without tests the implementation may diverge from the spec. |
| **Deployment & Ops** | No container images, CI/CD pipeline, health‑check endpoints for the orchestrator, metrics, logging aggregation. | Needed for a production‑ready system. |
| **Documentation & Versioning** | No API contract documentation (OpenAPI/Swagger), no versioning strategy for the API. | Impedes client integration and future evolution. |
| **Data Migration & Backup** | No migration strategy for MongoDB changes, no backup strategy. | Future changes could corrupt data. |

---

**Recommendations Before Moving to Programming**

1. **Define Authentication Flow**
   * Add `/api/auth/login`, `/api/auth/refresh`, `/api/auth/logout`.
   * Define JWT claims, expiration, and a minimal RBAC model.
   * Create a service to issue and validate tokens.

2. **Provider Management UI & API**
   * Create CRUD endpoints for providers (GET/POST/PUT/DELETE).
   * Store API keys encrypted in MongoDB or use an external secret manager.
   * Validate provider health on creation.

3. **Error Handling & Retry Layer**
   * Define a `RetryPolicy` object (maxRetries, backoff).
   * Implement a wrapper around LLM calls and Docker execution that logs, retries, and surfaces failures to the experiment state.

4. **Container Hardening**
   * Specify Docker run flags: `--cap-drop ALL`, `--net=none`, `-m`, `--cpus`, `--read-only`.
   * Ensure containers cannot persist state between runs.
   * Add a watchdog to kill orphaned containers on crash.

5. **Environment Schema Validation**
   * Extend `ExperimentPlan` schema to include `variableTypes` map.
   * Validate initial environment against these types on plan creation.
   * Expose a UI component for editing types.

6. **Sandboxed Script Execution**
   * Use a Python sandbox library or run scripts in a restricted Docker image with no external network.
   * Whitelist allowed modules and disallow file I/O outside a temp dir.

7. **Goal & Hook Compilation**
   * Pre‑compile condition scripts and hooks on plan creation to catch syntax errors.
   * Provide a runtime sandbox for evaluating conditions.

8. **Testing Infrastructure**
   * Create a Jest test suite for backend APIs, a Cypress suite for key UI flows, and a PyTest suite for script execution.
   * Define code‑coverage targets (≥80%).

9. **CI/CD & Deployment Docs**
   * Draft Dockerfiles for backend, frontend, and the Docker sandbox image.
   * Add GitHub Actions (or equivalent) for linting, tests, and image build/push.
   * Include health‑check endpoints and Prometheus metrics.

10. **API Documentation**
    * Generate OpenAPI spec from Express routes.
    * Host Swagger UI in `/api/docs`.

11. **Versioning & Migration**
    * Adopt semantic versioning for the API (`v1`).
    * Use Mongoose migration scripts for schema changes.

Once these items are defined and documented, the project can be confidently decomposed into user stories such as:

* User Story: **Authenticate User** – implement login, JWT, role checks.  
* User Story: **Create Provider** – CRUD, health‑check, secure key storage.  
* User Story: **Run Experiment** – orchestrator, event bus, container pool.  
* User Story: **Create/Update Plan** – UI wizard, type validation.  
* User Story: **View Logs** – SSE, log pagination.  

These stories can then be split further into development tasks for back‑end, front‑end, Docker sandbox, testing, and ops.
