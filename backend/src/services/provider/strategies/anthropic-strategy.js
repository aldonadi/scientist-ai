const ProviderStrategy = require('./provider-strategy');
const Anthropic = require('@anthropic-ai/sdk');

class AnthropicStrategy extends ProviderStrategy {
    async isValid(provider) {
        // Anthropic doesn't have a simple "check" endpoint in all versions, 
        // but let's assume if we can instantiate and maybe list models (if we could), it works.
        // For now, let's try to list models using the SDK if supported, or a dummy message?
        // Actually, creating the client is cheap. We need a call.
        // The SDK might not support model listing in older versions, but let's try typical approach.
        // As of recent SDKs, there isn't a models.list() method publicly documented like OpenAI?
        // Wait, the user story says "Anthropic: Static list (Anthropic doesn't have list endpoint)".
        // BUT, recently they might have added it.
        // Given the story explicitly said "Static list", I should stick to that for `listModels`.
        // However, for `isValid`, I need *some* network call. 
        // I'll try a very cheap dummy message with max_tokens=1.

        try {
            await this.listModels(provider); // If I implement listModels via API, this validates.
            // If listModels is static, this doesn't validate connectivity.
            // Let's do a dummy chat.
            await this._testConnection(provider);
            return true;
        } catch (error) {
            console.warn(`Anthropic connection check failed:`, error.message);
            return false;
        }
    }

    async isModelReady(provider, modelName) {
        const models = await this.listModels(provider);
        return models.includes(modelName);
    }

    async listModels(provider) {
        // Story says: Static List. 
        // But if I want to use SDK, I follow the story constraints unless I know better.
        // I will return the static list as per spec to be safe, 
        // OR I can checking if SDK has it. The SDK def maps to API. 
        // Current Anthropic API doesn't standardly expose model listing in the same way OpenAI does universally yet (or it's very new).
        // Safest: Static List.

        return [
            'claude-3-opus-20240229',
            'claude-3-sonnet-20240229',
            'claude-3-haiku-20240307',
            'claude-2.1',
            'claude-2.0',
            'claude-instant-1.2'
        ];
    }

    async *chat(provider, modelName, history, tools, config) {
        const client = await this._getClient(provider);

        // Anthropic system prompt is a top-level parameter
        const systemMessage = history.find(m => m.role === 'system');
        const messages = history.filter(m => m.role !== 'system');

        const stream = await client.messages.create({
            model: modelName,
            messages: messages,
            system: systemMessage ? systemMessage.content : undefined,
            stream: true,
            max_tokens: config.max_tokens || 4096, // Anthropic requires max_tokens
            ...config
        });

        for await (const chunk of stream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.text) {
                yield chunk.delta.text;
            }
        }
    }

    async _testConnection(provider) {
        const client = await this._getClient(provider);
        // Minimal request to test auth
        await client.messages.create({
            model: 'claude-instant-1.2',
            max_tokens: 1,
            messages: [{ role: 'user', content: 'Hi' }]
        });
    }

    async _getClient(provider) {
        const apiKey = await this._getApiKey(provider);
        const baseURL = provider.baseUrl || undefined;

        return new Anthropic({
            apiKey: apiKey,
            baseURL: baseURL
        });
    }

    async _getApiKey(provider) {
        const SecretStoreFactory = require('../../secrets/secret-store.factory');
        const secretStore = SecretStoreFactory.getStore();
        if (!provider.apiKey) throw new Error('API Key reference is missing');
        return await secretStore.retrieve(provider.apiKey);
    }
}

module.exports = AnthropicStrategy;
