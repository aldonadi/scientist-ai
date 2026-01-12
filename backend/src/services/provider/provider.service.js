const OllamaStrategy = require('./strategies/ollama-strategy');
const { retryWithBackoff } = require('../../utils/retry');
const OpenAIStrategy = require('./strategies/openai-strategy');
const AnthropicStrategy = require('./strategies/anthropic-strategy');

class ProviderService {
    constructor() {
        this.strategies = {
            OLLAMA: new OllamaStrategy(),
            OPENAI: new OpenAIStrategy(),
            ANTHROPIC: new AnthropicStrategy(),
            GENERIC_OPENAI: new OpenAIStrategy() // Reuses OpenAI strategy
        };
    }

    /**
     * Get the strategy for a provider type
     * @param {string} type 
     * @returns {ProviderStrategy}
     */
    _getStrategy(type) {
        const strategy = this.strategies[type];
        if (!strategy) {
            throw new Error(`Unsupported provider type: ${type}`);
        }
        return strategy;
    }

    /**
     * validate the provider configuration and connectivity
     * @param {Object} provider 
     * @returns {Promise<boolean>}
     */
    async isValid(provider) {
        return this._getStrategy(provider.type).isValid(provider);
    }

    /**
     * Check if a specific model is ready
     * @param {Object} provider 
     * @param {string} modelName 
     * @returns {Promise<boolean>}
     */
    async isModelReady(provider, modelName) {
        return this._getStrategy(provider.type).isModelReady(provider, modelName);
    }

    /**
     * List available models
     * @param {Object} provider 
     * @returns {Promise<string[]>}
     */
    async listModels(provider) {
        return this._getStrategy(provider.type).listModels(provider);
    }

    /**
     * Chat with result streaming
     * @param {Object} provider 
     * @param {string} modelName 
     * @param {Array} history 
     * @param {Array} tools 
     * @param {Object} config 
     * @returns {AsyncIterator}
     */
    async chat(provider, modelName, history, tools, config) {
        return retryWithBackoff(async () => {
            return await this._getStrategy(provider.type).chat(provider, modelName, history, tools, config);
        }, {
            maxRetries: 3,
            baseDelay: 1000,
            maxDelay: 30000,
            isRetryable: (error) => {
                // If it doesn't have a status, it might be a network error (retry)
                if (!error.status && !error.response?.status) return true;

                const status = error.status || error.response?.status;

                // Retry specific status codes
                if ([429, 500, 502, 503, 504].includes(status)) return true;

                // Do not retry 400, 401, 403, 404
                if ([400, 401, 403, 404].includes(status)) return false;

                // Default: allow retry for unknown errors (safe default for transient issues)
                return true;
            }
        });
    }
}

// Export singleton
module.exports = new ProviderService();
