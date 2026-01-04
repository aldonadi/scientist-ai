# Setup Database Connection

Configure Mongoose to connect to the MongoDB database using environment variables.

## Proposed Changes

### Backend

#### [NEW] [.env](file:///home/andrew/Projects/Code/web/scientist-ai/backend/.env)
- Create a new .env file with `MONGO_URI` and `PORT`.

#### [MODIFY] [index.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/index.js)
- Implement database connection logic using `mongoose.connect`.
- Use `process.env.MONGO_URI`.
- Add event listeners for `connected` and `error`.
- Ensure graceful failure if connection fails on startup.

## Verification Plan

### Automated Tests
- Run the backend server and check for successful connection log.
- `cd backend && npm run start` (or `node src/index.js`)

### Manual Verification
1.  **Positive Case**:
    -   Start the server: `node src/index.js` in `backend` directory.
    -   Observe console output for "Connected to MongoDB".
2.  **Negative Case**:
    -   Modify `.env` to have an invalid `MONGO_URI`.
    -   Start the server.
    -   Observe console output for error message and graceful exit (or error log).
