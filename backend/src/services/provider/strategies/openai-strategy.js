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

    async chat(provider, modelName, history, tools, config) {
        const client = await this._getClient(provider);

        // Transform tools to OpenAI format if provided
        // OpenAI expects: { type: 'function', function: { name, description, parameters } }
        const openaiTools = tools && tools.length > 0 ? tools.map(t => ({
            type: 'function',
            function: {
                name: t.name,
                description: t.description,
                parameters: t.parameters
            }
        })) : undefined;

        const stream = await client.chat.completions.create({
            model: modelName,
            messages: history,
            stream: true,
            tools: openaiTools,
            ...config
        });

        return (async function* () {
            // Track tool calls across chunks (OpenAI streams tool calls in pieces)
            const toolCallAccumulator = {};

            for await (const chunk of stream) {
                const delta = chunk.choices[0]?.delta;

                // Yield text content if present
                if (delta?.content) {
                    yield { type: 'text', content: delta.content };
                }

                // Accumulate and yield tool calls
                if (delta?.tool_calls) {
                    for (const toolCall of delta.tool_calls) {
                        const index = toolCall.index;
                        if (!toolCallAccumulator[index]) {
                            toolCallAccumulator[index] = {
                                id: toolCall.id || '',
                                name: '',
                                arguments: ''
                            };
                        }
                        if (toolCall.function?.name) {
                            toolCallAccumulator[index].name += toolCall.function.name;
                        }
                        if (toolCall.function?.arguments) {
                            toolCallAccumulator[index].arguments += toolCall.function.arguments;
                        }
                    }
                }

                // When chunk indicates finish, emit accumulated tool calls
                if (chunk.choices[0]?.finish_reason === 'tool_calls') {
                    for (const tc of Object.values(toolCallAccumulator)) {
                        try {
                            yield {
                                type: 'tool_call',
                                toolName: tc.name,
                                args: JSON.parse(tc.arguments)
                            };
                        } catch (e) {
                            yield {
                                type: 'tool_call',
                                toolName: tc.name,
                                args: tc.arguments // Pass as string if JSON parse fails
                            };
                        }
                    }
                }
            }
        })();
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
