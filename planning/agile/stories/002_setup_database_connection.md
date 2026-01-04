# Setup MongoDB Connection

- **Status:** READY
- **Points:** 1
- **Story ID:** 002
- **Type:** Feature

## Description
Configure Mongoose to connect to the MongoDB database using environment variables.

## User Story
**As a** System,
**I want** to connect to the Database,
**So that** I can store and persist data.

## Acceptance Criteria
- [ ] Generate a standard default `.env` file
- [ ] Before continuing, ask the Product Owner to update the default MONGO_URI, if they desire to.
- [ ] Mongoose connected to `MONGO_URI` from `.env`.
- [ ] Connection events (connected, error) are logged.
- [ ] Application fails gracefully if DB is not reachable on startup.

## Testing
1. Start the server with a valid MONGO_URI.
2. Verify 'Connected to MongoDB' log message.
3. Start with invalid URI and verify error handling.

## Review
