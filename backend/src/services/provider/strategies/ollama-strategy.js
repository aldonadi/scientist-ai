const ProviderStrategy = require('./provider-strategy');
const { Ollama } = require('ollama');

class OllamaStrategy extends ProviderStrategy {
    async isValid(provider) {
        try {
            await this.listModels(provider);
            return true;
        } catch (error) {
            console.warn(`Ollama connection check failed for ${provider.baseUrl}:`, error.message);
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
        const client = this._getClient(provider);
        try {
            const response = await client.list();
            return response.models.map(m => m.name);
        } catch (error) {
            throw new Error(`Failed to list models: ${error.message}`);
        }
    }

    async *chat(provider, modelName, history, tools, config) {
        const client = this._getClient(provider);

        const stream = await client.chat({
            model: modelName,
            messages: history,
            stream: true,
            options: config,
        });

        for await (const chunk of stream) {
            // Yield text content if present
            if (chunk.message && chunk.message.content) {
                yield { type: 'text', content: chunk.message.content };
            }

            // Yield tool calls if present
            if (chunk.message && chunk.message.tool_calls) {
                for (const toolCall of chunk.message.tool_calls) {
                    yield {
                        type: 'tool_call',
                        toolName: toolCall.function.name,
                        args: toolCall.function.arguments
                    };
                }
            }
        }
    }

    _getClient(provider) {
        // The ollama library takes a 'host' parameter in its constructor
        // Default is http://127.0.0.1:11434
        // We use provider.baseUrl if present. 
        // Note: 'ollama' package handles host parsing, but let's pass it cleanly.
        return new Ollama({
            host: provider.baseUrl || 'http://127.0.0.1:11434'
        });
    }
}

module.exports = OllamaStrategy;
