const ProviderStrategy = require('./provider-strategy');

class OllamaStrategy extends ProviderStrategy {
    async isValid(provider) {
        try {
            const models = await this.listModels(provider);
            return models.length >= 0;
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
        const baseUrl = this._ensureBaseUrl(provider.baseUrl);
        const response = await fetch(`${baseUrl}/api/tags`);

        if (!response.ok) {
            throw new Error(`Failed to list models: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.models.map(m => m.name);
    }

    async *chat(provider, modelName, history, tools, config) {
        const baseUrl = this._ensureBaseUrl(provider.baseUrl);

        const payload = {
            model: modelName,
            messages: history,
            stream: true,
            options: config,
        };

        const response = await fetch(`${baseUrl}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Chat request failed: ${response.status} ${response.statusText}`);
        }

        // Web Stream processing
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');

                // Process all complete lines
                buffer = lines.pop(); // Keep the last partial line in buffer

                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const json = JSON.parse(line);
                        if (json.done) return; // Stream finished
                        if (json.message && json.message.content) {
                            yield json.message.content;
                        }
                    } catch (e) {
                        console.warn('Failed to parse Ollama chunk:', e);
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }
    }

    _ensureBaseUrl(url) {
        if (!url) return 'http://localhost:11434';
        return url.replace(/\/$/, '');
    }
}

module.exports = OllamaStrategy;
