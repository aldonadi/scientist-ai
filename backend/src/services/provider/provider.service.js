const OllamaStrategy = require('./strategies/ollama-strategy');
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
        return this._getStrategy(provider.type).chat(provider, modelName, history, tools, config);
    }
}

// Export singleton
module.exports = new ProviderService();
