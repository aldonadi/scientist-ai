# Implementation Plan - LLM Retry Logic (Story 054)

## Goal
Implement exponential backoff retry logic for LLM calls to handle transient network issues and rate limits gracefully, preventing experiment crashes.

## Proposed Changes

### [Backend Utilities]

#### [NEW] [retry.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/utils/retry.js)
Create a generic retry utility function `retryWithBackoff`.
- **Logic**:
    - Retries async function `fn`.
    - Exponential backoff: `delay = min(baseDelay * 2^attempt, maxDelay)`.
    - Full Jitter: `sleep(random_between(0, delay))`.
    - Checks `isRetryable` predicate if provided, or default checks for network/5xx errors.
    - Logs attempts.

### [Provider Service]

#### [MODIFY] [provider.service.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/services/provider/provider.service.js)
- Import `retryWithBackoff`.
- In `chat()` method, wrap the strategy call with `retryWithBackoff`.
- Define `isRetryable` logic:
    - Retry on: Network errors, 429, 500, 502, 503, 504.
    - Do NOT retry on: 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found).

## Verification Plan

### Automated Tests
Run unit tests for `ProviderService`.
`npm test backend/tests/services/provider/provider.service.test.js`

#### New Test Cases in `provider.service.test.js`
- **Retry Success**: Mock strategy to fail twice then succeed. Verify 3 calls total.
- **Retry Exhaustion**: Mock strategy to fail permanently. Verify N+1 calls and final error throw.
- **Non-Retryable Error**: Mock strategy to throw 400. Verify 1 call and immediate error throw.
- **Backoff Calculation**: (Optional) Verify delay roughly increases (or just verify call count).

### Manual Verification
None required if unit tests are comprehensive, as this is backend logic.
