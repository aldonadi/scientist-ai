/**
 * Retry utility with exponential backoff and jitter
 * @param {Function} fn - Async function to retry
 * @param {Object} options
 * @param {number} options.maxRetries - Maximum number of retries (default: 3)
 * @param {number} options.baseDelay - Base delay in ms (default: 1000)
 * @param {number} options.maxDelay - Maximum delay in ms (default: 30000)
 * @param {Function} options.isRetryable - Predicate function (error) => boolean
 * @param {Function} options.onRetry - Callback function (error, attempt, delay) => void
 * @returns {Promise<any>}
 */
async function retryWithBackoff(fn, options = {}) {
    const {
        maxRetries = 3,
        baseDelay = 1000,
        maxDelay = 30000,
        isRetryable = null,
        onRetry = null
    } = options;

    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            // If we've exhausted retries, throw immediately
            if (attempt === maxRetries) {
                break;
            }

            // Check if error is retryable
            if (isRetryable && !isRetryable(error)) {
                throw error;
            }

            // Default retry logic if no predicate provided (retry everything by default unless specified)
            // But usually we want to control this.
            // If no predicate, we assume everything is retryable except explicit non-retryables if we knew them.
            // For safety, if no predicate is provided, we just retry.

            // Calculate delay with exponential backoff
            // constant * 2^attempt
            const expBackoff = baseDelay * Math.pow(2, attempt);
            const cappedDelay = Math.min(expBackoff, maxDelay);

            // Add full jitter: random between 0 and cappedDelay
            // This prevents thundering herd
            const delay = Math.random() * cappedDelay;

            if (onRetry) {
                onRetry(error, attempt + 1, delay);
            }

            if (global.logger) {
                global.logger.warn(`Retry attempt ${attempt + 1}/${maxRetries} after ${Math.round(delay)}ms due to: ${error.message}`);
            }

            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw lastError;
}

module.exports = {
    retryWithBackoff
};
