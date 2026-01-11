# Implement LLM Retry Logic

- **Status:** READY
- **Points:** 3
- **Story ID:** 054
- **Type:** Feature

## Description
Implement exponential backoff retry logic for LLM calls as required by SPEC §8.2. Currently, a single LLM failure crashes the entire experiment. Transient network issues or rate limiting should be handled gracefully.

### Review Finding Reference
- **Source**: Third-Party Review 1 (H6, Note in Section 3.2)
- **Severity**: MEDIUM
- **Impact**: Experiments fail on transient errors

## User Story
**As a** User,
**I want** the system to retry failed LLM calls,
**So that** my experiments don't fail due to temporary network issues.

## Acceptance Criteria
- [ ] LLM calls implement retry with exponential backoff
- [ ] Maximum retry count is configurable (default: 3)
- [ ] Base delay is configurable (default: 1000ms)
- [ ] Maximum delay is capped (default: 30000ms)
- [ ] Retryable errors are identified (network errors, 429, 500-503)
- [ ] Non-retryable errors fail immediately (400, 401, 404)
- [ ] Retry attempts are logged
- [ ] Unit tests cover retry scenarios

## Testing Strategy

### Unit Tests
- **File**: `backend/tests/provider.service.test.js`
- **Cases**:
    - Retries on network error up to max retries
    - Succeeds on second attempt
    - Fails after max retries exhausted
    - Does not retry on 400 errors
    - Exponential backoff increases delays

## Technical Notes
- Implement retry wrapper in `provider.service.js` or as utility
- Use exponential backoff: `delay = min(baseDelay * 2^attempt, maxDelay)`
- Add jitter to prevent thundering herd
- Consider using existing retry library like `async-retry` if desired

Example implementation pattern:
```javascript
async function withRetry(fn, { maxRetries = 3, baseDelay = 1000, maxDelay = 30000 }) {
    let lastError;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            if (!isRetryable(error)) throw error;
            lastError = error;
            const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
            await sleep(delay + Math.random() * 1000);
        }
    }
    throw lastError;
}
```

## Review
