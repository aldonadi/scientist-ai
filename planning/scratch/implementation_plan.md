# Project Initialization Plan

This plan outlines the steps to initialize the `scientist-ai` project structure as defined in Story 001.

## User Review Required
> [!NOTE]
> I will be using `npx @angular/cli new` to create the frontend. I will assume default settings (CSS, with routing) unless otherwise specified. I will also add TailwindCSS as per SPEC.

## Proposed Changes

### Root Directory
#### [NEW] [.gitignore](file:///home/andrew/Projects/Code/web/scientist-ai/.gitignore)
- Standard node entries (`node_modules`, `dist`, `.env`, etc.)

#### [NEW] [package.json](file:///home/andrew/Projects/Code/web/scientist-ai/package.json)
- Check if needed for orchestration (e.g. `concurrently` to run both). I will add a basic one for now to manage dev scripts.

### Backend
#### [NEW] [backend/package.json](file:///home/andrew/Projects/Code/web/scientist-ai/backend/package.json)
- Initialize with `express`, `mongoose`, `dotenv`, `cors`, `helmet`, `morgan`, `dockerode`, `ollama`, `python-shell` or `execa` as dependencies.
- Dev dependencies: `nodemon`, `jest`, `supertest`.

#### [NEW] [backend/src/index.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/index.js)
- Basic Express server setup.

### Frontend
#### [NEW] [frontend/](file:///home/andrew/Projects/Code/web/scientist-ai/frontend/)
- Generate using Angular CLI.
- Add TailwindCSS configuration.

## Verification Plan

### Automated Tests
- **Directory Structure Check**: I will run a script to verify that `frontend` and `backend` folders exist and contain `package.json`.
- **Install Check**: Run `npm install` in both directories to ensure dependencies are resolvable.
- **Start Check**: Try to start the backend server and ensure it listens on the port.
- **Build Check**: Try to build the frontend (`ng build`) to ensure it's valid.

### Manual Verification
- Inspect the file tree.
