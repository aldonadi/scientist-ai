# Refine SPEC.md: Configuration & Connectivity

## Goal Description
Address user requirement to define how the system is configured (hostings, DB URLs) and how connectivity is tested and reported to the frontend.

## User Review Required
None.

## Proposed Changes

### Documentation
#### [MODIFY] [SPEC.md](file:///home/andrew/Projects/Code/web/scientist-ai/SPEC.md)

1.  **New Section 11: Configuration & Deployment**:
    *   **Backend Config**: Define standard `.env` variables (`PORT`, `MONGO_URI`, `API_BASE_URL`).
    *   **Frontend Config**: Define how the Angular app locates the backend (environment files).
    *   **Logic Location**: Explicitly state that "Health Checks" are a backend responsibility exposed via API.

2.  **API Update**:
    *   Add `GET /api/health` endpoint.
    *   Response format: `{ database: "connected", providers: [{name: "Ollama", status: "ok"}] }`.

3.  **UI Update**:
    *   Refine Dashboard section to mention polling `GET /api/health`.

## Verification Plan
### Manual Verification
- Review `SPEC.md` to ensure the new section is comprehensive and the API endpoint is clearly defined.
