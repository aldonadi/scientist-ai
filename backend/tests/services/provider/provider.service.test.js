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
    });
});
