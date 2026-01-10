const providerService = require('../../../src/services/provider/provider.service');
const SecretStoreFactory = require('../../../src/services/secrets/secret-store.factory');
const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');

// Mock dependencies
jest.mock('../../../src/services/secrets/secret-store.factory');
jest.mock('openai');
jest.mock('@anthropic-ai/sdk');

// Mock global fetch for Ollama (since we kept it as fetch)
global.fetch = jest.fn();

describe('ProviderService', () => {

    beforeEach(() => {
        global.fetch.mockClear();
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

        it('should list models successfully', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ models: [{ name: 'llama3:latest' }] })
            });

            const models = await providerService.listModels(ollamaProvider);
            expect(models).toEqual(['llama3:latest']);
            expect(global.fetch).toHaveBeenCalledWith('http://localhost:11434/api/tags');
        });
    });

    describe('OpenAI Strategy', () => {
        const openaiProvider = {
            type: 'OPENAI',
            apiKey: 'secret-ref'
        };

        it('should list models using SDK', async () => {
            // Mock OpenAI instance and list() method
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
    });

    describe('Anthropic Strategy', () => {
        const anthropicProvider = {
            type: 'ANTHROPIC',
            apiKey: 'secret-ref'
        };

        it('should return static model list (as per spec) but still be valid', async () => {
            // Mock Anthropic instance
            const mockCreate = jest.fn().mockResolvedValue({});
            Anthropic.mockImplementation(() => ({
                messages: { create: mockCreate }
            }));

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
    });
});
