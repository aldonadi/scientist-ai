/**
 * Abstract base class for Provider Strategies.
 * Defines the interface that all provider strategies must implement.
 */
class ProviderStrategy {
    constructor() {
        if (this.constructor === ProviderStrategy) {
            throw new Error("Abstract classes can't be instantiated.");
        }
    }

    /**
     * validate the provider configuration and connectivity
     * @param {Object} provider - The provider configuration object
     * @returns {Promise<boolean>}
     */
    async isValid(provider) {
        throw new Error("Method 'isValid()' must be implemented.");
    }

    /**
     * Check if a specific model is ready/available
     * @param {Object} provider - The provider configuration object
     * @param {string} modelName - The model to check
     * @returns {Promise<boolean>}
     */
    async isModelReady(provider, modelName) {
        throw new Error("Method 'isModelReady()' must be implemented.");
    }

    /**
     * List available models
     * @param {Object} provider - The provider configuration object
     * @returns {Promise<string[]>}
     */
    async listModels(provider) {
        throw new Error("Method 'listModels()' must be implemented.");
    }

    /**
     * Chat with the model
     * @param {Object} provider - The provider configuration object
     * @param {string} modelName - The model to chat with
     * @param {Array} history - Chat history
     * @param {Array} tools - Available tools
     * @param {Object} config - Model/Provider config
     * @returns {AsyncIterator} Stream of response chunks
     */
    async chat(provider, modelName, history, tools, config) {
        throw new Error("Method 'chat()' must be implemented.");
    }
}

module.exports = ProviderStrategy;
