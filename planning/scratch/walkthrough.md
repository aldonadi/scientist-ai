# Walkthrough - Setup Database Connection

Verified the implementation of MongoDB connection in the backend using Mongoose.

## Changes

### Backend

#### [NEW] [.env](file:///home/andrew/Projects/Code/web/scientist-ai/backend/.env)
- Created `.env` file with `MONGO_URI` and `PORT`.

#### [MODIFY] [index.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/index.js)
- Implemented Mongoose connection logic using `process.env.MONGO_URI`.
- Added error handling and logging.

## Verification Results

### Automated Tests
- Ran `node src/index.js` manually.
- **Pass**: Confirmed "Connected to MongoDB" log message.

### Manual Verification
- Verified that the server starts and connects to the database successfully.
- Verified that the server fails gracefully (stacks trace and exit) if `MONGO_URI` is missing or invalid (tested during implementation phase).
