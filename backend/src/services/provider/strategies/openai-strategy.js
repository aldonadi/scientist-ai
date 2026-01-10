const ProviderStrategy = require('./provider-strategy');
const OpenAI = require('openai');

class OpenAIStrategy extends ProviderStrategy {
    async isValid(provider) {
        try {
            await this.listModels(provider);
            return true;
        } catch (error) {
            console.warn(`OpenAI connection check failed:`, error.message);
            return false;
        }
    }

    async isModelReady(provider, modelName) {
        try {
            const models = await this.listModels(provider);
            return models.includes(modelName);
        } catch (error) {
            return false;
        }
    }

    async listModels(provider) {
        const client = await this._getClient(provider);
        const response = await client.models.list();
        return response.data.map(m => m.id);
    }

    async *chat(provider, modelName, history, tools, config) {
        const client = await this._getClient(provider);

        const stream = await client.chat.completions.create({
            model: modelName,
            messages: history,
            stream: true,
            ...config
        });

        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
                yield content;
            }
        }
    }

    async _getClient(provider) {
        const apiKey = await this._getApiKey(provider);
        const baseURL = provider.baseUrl || undefined; // SDK defaults to https://api.openai.com/v1

        return new OpenAI({
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

module.exports = OpenAIStrategy;
