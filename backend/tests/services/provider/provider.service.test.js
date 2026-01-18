const providerService = require('../../../src/services/provider/provider.service');
const SecretStoreFactory = require('../../../src/services/secrets/secret-store.factory');
const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const { Ollama } = require('ollama');

// Mock dependencies
jest.mock('../../../src/services/secrets/secret-store.factory');
jest.mock('openai');
jest.mock('@anthropic-ai/sdk');
jest.mock('ollama');

describe('ProviderService', () => {

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock Secret Store
        SecretStoreFactory.getStore.mockReturnValue({
            retrieve: jest.fn().mockResolvedValue('test-api-key')
        });
    });

    describe('Ollama Strategy', () => {
        const ollamaProvider = {
            type: 'OLLAMA',
            baseUrl: 'http://localhost:11434'
        };

        it('should list models successfully using SDK', async () => {
            // Mock Ollama instance
            const mockList = jest.fn().mockResolvedValue({
                models: [{ name: 'llama3:latest' }]
            });

            Ollama.mockImplementation(() => ({
                list: mockList
            }));

            const models = await providerService.listModels(ollamaProvider);
            expect(models).toEqual(['llama3:latest']);
            expect(Ollama).toHaveBeenCalledWith({ host: 'http://localhost:11434' });
            expect(mockList).toHaveBeenCalled();
        });

        it('should pass tools to client.chat() when provided', async () => {
            // Mock Ollama instance with chat
            const mockChat = jest.fn().mockResolvedValue({
                [Symbol.asyncIterator]: async function* () {
                    yield { message: { content: 'Hello' } };
                }
            });

            Ollama.mockImplementation(() => ({
                chat: mockChat
            }));

            const tools = [
                { name: 'get_weather', description: 'Get weather', parameters: { type: 'object' } }
            ];

            const stream = await providerService.chat(ollamaProvider, 'llama3', [], tools, {});
            // Consume the stream
            for await (const _chunk of stream) { /* consume */ }

            expect(mockChat).toHaveBeenCalledWith(expect.objectContaining({
                tools: [
                    {
                        type: 'function',
                        function: {
                            name: 'get_weather',
                            description: 'Get weather',
                            parameters: { type: 'object' }
                        }
                    }
                ]
            }));
        });

        it('should omit tools when empty array provided', async () => {
            const mockChat = jest.fn().mockResolvedValue({
                [Symbol.asyncIterator]: async function* () {
                    yield { message: { content: 'Hello' } };
                }
            });

            Ollama.mockImplementation(() => ({
                chat: mockChat
            }));

            const stream = await providerService.chat(ollamaProvider, 'llama3', [], [], {});
            for await (const _chunk of stream) { /* consume */ }

            expect(mockChat).toHaveBeenCalledWith(expect.objectContaining({
                tools: undefined
            }));
        });

        it('should yield tool_call events from stream', async () => {
            const mockChat = jest.fn().mockResolvedValue({
                [Symbol.asyncIterator]: async function* () {
                    yield {
                        message: {
                            tool_calls: [
                                { function: { name: 'get_weather', arguments: { city: 'NYC' } } }
                            ]
                        }
                    };
                }
            });

            Ollama.mockImplementation(() => ({
                chat: mockChat
            }));

            const stream = await providerService.chat(ollamaProvider, 'llama3', [], [], {});
            const events = [];
            for await (const chunk of stream) {
                events.push(chunk);
            }

            expect(events).toContainEqual({
                type: 'tool_call',
                toolName: 'get_weather',
                args: { city: 'NYC' }
            });
        });
    });

    describe('OpenAI Strategy', () => {
        const openaiProvider = {
            type: 'OPENAI',
            apiKey: 'secret-ref'
        };

        it('should list models using SDK', async () => {
            const mockList = jest.fn().mockResolvedValue({
                data: [{ id: 'gpt-4' }]
            });

            OpenAI.mockImplementation(() => ({
                models: { list: mockList }
            }));

            const models = await providerService.listModels(openaiProvider);
            expect(models).toEqual(['gpt-4']);
            expect(OpenAI).toHaveBeenCalledWith(expect.objectContaining({
                apiKey: 'test-api-key'
            }));
            expect(mockList).toHaveBeenCalled();
        });

        it('should pass tools to client.chat.completions.create() when provided', async () => {
            const mockCreate = jest.fn().mockResolvedValue({
                [Symbol.asyncIterator]: async function* () {
                    yield { choices: [{ delta: { content: 'Hello' } }] };
                }
            });

            OpenAI.mockImplementation(() => ({
                chat: { completions: { create: mockCreate } }
            }));

            const tools = [
                { name: 'search', description: 'Search the web', parameters: { type: 'object' } }
            ];

            const stream = await providerService.chat(openaiProvider, 'gpt-4', [], tools, {});
            for await (const _chunk of stream) { /* consume */ }

            expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
                tools: [
                    {
                        type: 'function',
                        function: {
                            name: 'search',
                            description: 'Search the web',
                            parameters: { type: 'object' }
                        }
                    }
                ]
            }));
        });
    });

    describe('Anthropic Strategy', () => {
        const anthropicProvider = {
            type: 'ANTHROPIC',
            apiKey: 'secret-ref'
        };

        it('should return static model list', async () => {
            const models = await providerService.listModels(anthropicProvider);
            expect(models).toContain('claude-3-opus-20240229');
        });

        it('should validate connection using dummy chat', async () => {
            const mockCreate = jest.fn().mockResolvedValue({});
            Anthropic.mockImplementation(() => ({
                messages: { create: mockCreate }
            }));

            const isValid = await providerService.isValid(anthropicProvider);
            expect(isValid).toBe(true);
            expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
                max_tokens: 1
            }));
        });

        it('should pass tools to client.messages.create() with input_schema format', async () => {
            const mockCreate = jest.fn().mockResolvedValue({
                [Symbol.asyncIterator]: async function* () {
                    yield { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Hi' } };
                }
            });

            Anthropic.mockImplementation(() => ({
                messages: { create: mockCreate }
            }));

            const tools = [
                { name: 'calculator', description: 'Do math', parameters: { type: 'object' } }
            ];

            const stream = await providerService.chat(anthropicProvider, 'claude-3-opus-20240229', [], tools, {});
            for await (const _chunk of stream) { /* consume */ }

            expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
                tools: [
                    {
                        name: 'calculator',
                        description: 'Do math',
                        input_schema: { type: 'object' }
                    }
                ]
            }));
        });
    });
    describe('Retry Logic', () => {
        const mockProvider = { type: 'OLLAMA' };

        beforeEach(() => {
            jest.spyOn(global, 'setTimeout').mockImplementation((fn) => {
                fn();
                return 1;
            });
        });

        afterEach(() => {
            global.setTimeout.mockRestore();
        });

        it('should retry on network error and eventually succeed', async () => {
            const mockChat = jest.fn()
                .mockRejectedValueOnce(new Error('Network error'))
                .mockRejectedValueOnce(new Error('Network error'))
                .mockResolvedValue('success');

            Ollama.mockImplementation(() => ({
                chat: mockChat
            }));

            const result = await providerService.chat(mockProvider, 'model', [], [], {});
            expect(result).toBeDefined();
            expect(mockChat).toHaveBeenCalledTimes(3);
        });

        it('should fail after max retries are exhausted', async () => {
            const mockChat = jest.fn().mockRejectedValue(new Error('Persistent error'));

            Ollama.mockImplementation(() => ({
                chat: mockChat
            }));

            await expect(providerService.chat(mockProvider, 'model', [], [], {}))
                .rejects.toThrow('Persistent error');

            // Initial + 3 retries = 4 calls total
            expect(mockChat).toHaveBeenCalledTimes(4);
        });

        it('should NOT retry on 400 Bad Request', async () => {
            const error = new Error('Bad Request');
            error.status = 400;
            const mockChat = jest.fn().mockRejectedValue(error);

            Ollama.mockImplementation(() => ({
                chat: mockChat
            }));

            await expect(providerService.chat(mockProvider, 'model', [], [], {}))
                .rejects.toThrow('Bad Request');

            expect(mockChat).toHaveBeenCalledTimes(1);
        });

        it('should NOT retry on 401 Unauthorized', async () => {
            const error = new Error('Unauthorized');
            error.status = 401;
            const mockChat = jest.fn().mockRejectedValue(error);

            Ollama.mockImplementation(() => ({
                chat: mockChat
            }));

            await expect(providerService.chat(mockProvider, 'model', [], [], {}))
                .rejects.toThrow('Unauthorized');

            expect(mockChat).toHaveBeenCalledTimes(1);
        });

        it('should retry on 429 Too Many Requests', async () => {
            const error = new Error('Rate Limited');
            error.status = 429;
            const mockChat = jest.fn()
                .mockRejectedValueOnce(error)
                .mockResolvedValue('success');

            Ollama.mockImplementation(() => ({
                chat: mockChat
            }));

            const result = await providerService.chat(mockProvider, 'model', [], [], {});
            expect(result).toBeDefined();
            expect(mockChat).toHaveBeenCalledTimes(2);
        });

        it('should retry on 503 Service Unavailable', async () => {
            const error = new Error('Service Unavailable');
            error.status = 503;
            const mockChat = jest.fn()
                .mockRejectedValueOnce(error)
                .mockResolvedValue('success');

            Ollama.mockImplementation(() => ({
                chat: mockChat
            }));

            const result = await providerService.chat(mockProvider, 'model', [], [], {});
            expect(result).toBeDefined();
            expect(mockChat).toHaveBeenCalledTimes(2);
        });
    });
});

