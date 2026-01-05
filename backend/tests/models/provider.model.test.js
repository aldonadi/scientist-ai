const mongoose = require('mongoose');
const { Provider, PROVIDER_TYPES, PROVIDER_TYPE_VALUES, URL_REGEX } = require('../../src/models/provider.model');
const { MongoMemoryServer } = require('mongodb-memory-server');

describe('Provider Model Schema Test', () => {

    describe('Schema Validation (without DB)', () => {

        it('should be valid with all required fields', () => {
            const provider = new Provider({
                name: 'Ollama Local',
                type: PROVIDER_TYPES.OLLAMA,
                baseUrl: 'http://localhost:11434'
            });
            const err = provider.validateSync();
            expect(err).toBeUndefined();
        });

        it('should be valid with all fields including optional apiKeyRef', () => {
            const provider = new Provider({
                name: 'OpenAI Production',
                type: PROVIDER_TYPES.OPENAI,
                baseUrl: 'https://api.openai.com',
                apiKeyRef: 'openai-api-key-ref'
            });
            const err = provider.validateSync();
            expect(err).toBeUndefined();
        });

        it('should be invalid if name is missing', () => {
            const provider = new Provider({
                type: PROVIDER_TYPES.OLLAMA,
                baseUrl: 'http://localhost:11434'
            });
            const err = provider.validateSync();
            expect(err.errors.name).toBeDefined();
            expect(err.errors.name.message).toBe('Provider name is required');
        });

        it('should be invalid if type is missing', () => {
            const provider = new Provider({
                name: 'Test Provider',
                baseUrl: 'http://localhost:11434'
            });
            const err = provider.validateSync();
            expect(err.errors.type).toBeDefined();
            expect(err.errors.type.message).toBe('Provider type is required');
        });

        it('should be invalid if baseUrl is missing', () => {
            const provider = new Provider({
                name: 'Test Provider',
                type: PROVIDER_TYPES.OLLAMA
            });
            const err = provider.validateSync();
            expect(err.errors.baseUrl).toBeDefined();
            expect(err.errors.baseUrl.message).toBe('Base URL is required');
        });

        it('should be invalid if type is not in enum', () => {
            const provider = new Provider({
                name: 'Test Provider',
                type: 'INVALID_TYPE',
                baseUrl: 'http://localhost:11434'
            });
            const err = provider.validateSync();
            expect(err.errors.type).toBeDefined();
            expect(err.errors.type.message).toContain('is not a valid provider type');
            expect(err.errors.type.message).toContain('OLLAMA');
        });

        it('should accept all valid provider types', () => {
            PROVIDER_TYPE_VALUES.forEach(type => {
                const provider = new Provider({
                    name: `Provider for ${type}`,
                    type: type,
                    baseUrl: 'http://localhost:11434'
                });
                const err = provider.validateSync();
                expect(err).toBeUndefined();
            });
        });

        it('should have null as default for apiKeyRef', () => {
            const provider = new Provider({
                name: 'Test Provider',
                type: PROVIDER_TYPES.OLLAMA,
                baseUrl: 'http://localhost:11434'
            });
            expect(provider.apiKeyRef).toBeNull();
        });

        // URL validation tests
        describe('URL Validation', () => {

            it('should accept valid http URL with hostname', () => {
                const provider = new Provider({
                    name: 'Test',
                    type: PROVIDER_TYPES.OLLAMA,
                    baseUrl: 'http://localhost'
                });
                const err = provider.validateSync();
                expect(err).toBeUndefined();
            });

            it('should accept valid https URL with hostname', () => {
                const provider = new Provider({
                    name: 'Test',
                    type: PROVIDER_TYPES.OPENAI,
                    baseUrl: 'https://api.openai.com'
                });
                const err = provider.validateSync();
                expect(err).toBeUndefined();
            });

            it('should accept URL with port', () => {
                const provider = new Provider({
                    name: 'Test',
                    type: PROVIDER_TYPES.OLLAMA,
                    baseUrl: 'http://localhost:11434'
                });
                const err = provider.validateSync();
                expect(err).toBeUndefined();
            });

            it('should accept URL with path', () => {
                const provider = new Provider({
                    name: 'Test',
                    type: PROVIDER_TYPES.GENERIC_OPENAI,
                    baseUrl: 'https://my-server.com/v1/api'
                });
                const err = provider.validateSync();
                expect(err).toBeUndefined();
            });

            it('should accept URL with subdomain', () => {
                const provider = new Provider({
                    name: 'Test',
                    type: PROVIDER_TYPES.ANTHROPIC,
                    baseUrl: 'https://api.anthropic.com'
                });
                const err = provider.validateSync();
                expect(err).toBeUndefined();
            });

            it('should reject URL without protocol', () => {
                const provider = new Provider({
                    name: 'Test',
                    type: PROVIDER_TYPES.OLLAMA,
                    baseUrl: 'localhost:11434'
                });
                const err = provider.validateSync();
                expect(err.errors.baseUrl).toBeDefined();
                expect(err.errors.baseUrl.message).toContain('is not a valid URL');
            });

            it('should reject URL with ftp protocol', () => {
                const provider = new Provider({
                    name: 'Test',
                    type: PROVIDER_TYPES.OLLAMA,
                    baseUrl: 'ftp://server.com'
                });
                const err = provider.validateSync();
                expect(err.errors.baseUrl).toBeDefined();
            });

            it('should reject empty string for baseUrl', () => {
                const provider = new Provider({
                    name: 'Test',
                    type: PROVIDER_TYPES.OLLAMA,
                    baseUrl: ''
                });
                const err = provider.validateSync();
                expect(err.errors.baseUrl).toBeDefined();
            });

            it('should reject malformed URL', () => {
                const provider = new Provider({
                    name: 'Test',
                    type: PROVIDER_TYPES.OLLAMA,
                    baseUrl: 'http://'
                });
                const err = provider.validateSync();
                expect(err.errors.baseUrl).toBeDefined();
            });
        });
    });

    describe('Index Definition', () => {
        it('should define unique index on name field', () => {
            const indexes = Provider.schema.indexes();
            const foundIndex = indexes.find(index => {
                const keys = index[0];
                return keys.name === 1;
            });
            expect(foundIndex).toBeDefined();
            expect(foundIndex[1].unique).toBe(true);
        });
    });

    describe('PROVIDER_TYPES enum', () => {
        it('should export all expected provider types', () => {
            expect(PROVIDER_TYPES.OLLAMA).toBe('OLLAMA');
            expect(PROVIDER_TYPES.OPENAI).toBe('OPENAI');
            expect(PROVIDER_TYPES.ANTHROPIC).toBe('ANTHROPIC');
            expect(PROVIDER_TYPES.GENERIC_OPENAI).toBe('GENERIC_OPENAI');
        });

        it('should be frozen (immutable)', () => {
            expect(Object.isFrozen(PROVIDER_TYPES)).toBe(true);
        });

        it('should have PROVIDER_TYPE_VALUES array matching enum values', () => {
            expect(PROVIDER_TYPE_VALUES).toEqual(expect.arrayContaining([
                'OLLAMA', 'OPENAI', 'ANTHROPIC', 'GENERIC_OPENAI'
            ]));
            expect(PROVIDER_TYPE_VALUES.length).toBe(4);
        });
    });

    describe('Database Integration', () => {
        let mongoServer;

        beforeAll(async () => {
            mongoServer = await MongoMemoryServer.create();
            const mongoUri = mongoServer.getUri();
            await mongoose.connect(mongoUri);
        });

        afterAll(async () => {
            await mongoose.disconnect();
            await mongoServer.stop();
        });

        beforeEach(async () => {
            await Provider.deleteMany({});
        });

        it('should save provider successfully with all required fields', async () => {
            const provider = new Provider({
                name: 'Ollama Local',
                type: PROVIDER_TYPES.OLLAMA,
                baseUrl: 'http://localhost:11434'
            });
            const saved = await provider.save();
            expect(saved._id).toBeDefined();
            expect(saved.name).toBe('Ollama Local');
            expect(saved.type).toBe('OLLAMA');
            expect(saved.baseUrl).toBe('http://localhost:11434');
            expect(saved.createdAt).toBeDefined();
            expect(saved.updatedAt).toBeDefined();
        });

        it('should save provider with optional apiKeyRef', async () => {
            const provider = new Provider({
                name: 'OpenAI',
                type: PROVIDER_TYPES.OPENAI,
                baseUrl: 'https://api.openai.com',
                apiKeyRef: 'my-secret-key-ref'
            });
            const saved = await provider.save();
            expect(saved.apiKeyRef).toBe('my-secret-key-ref');
        });

        it('should save provider without apiKeyRef', async () => {
            const provider = new Provider({
                name: 'Local Ollama',
                type: PROVIDER_TYPES.OLLAMA,
                baseUrl: 'http://localhost:11434'
            });
            const saved = await provider.save();
            expect(saved.apiKeyRef).toBeNull();
        });

        it('should enforce unique constraint on name', async () => {
            const provider1 = new Provider({
                name: 'Duplicate Name',
                type: PROVIDER_TYPES.OLLAMA,
                baseUrl: 'http://localhost:11434'
            });
            await provider1.save();

            const provider2 = new Provider({
                name: 'Duplicate Name',
                type: PROVIDER_TYPES.OPENAI,
                baseUrl: 'https://api.openai.com'
            });

            await expect(provider2.save()).rejects.toThrow();
        });

        it('should allow different names', async () => {
            const provider1 = new Provider({
                name: 'Provider One',
                type: PROVIDER_TYPES.OLLAMA,
                baseUrl: 'http://localhost:11434'
            });
            await provider1.save();

            const provider2 = new Provider({
                name: 'Provider Two',
                type: PROVIDER_TYPES.OLLAMA,
                baseUrl: 'http://localhost:11434'
            });
            const saved = await provider2.save();
            expect(saved._id).toBeDefined();
        });

        it('should set timestamps on create', async () => {
            const provider = new Provider({
                name: 'Timestamped Provider',
                type: PROVIDER_TYPES.OLLAMA,
                baseUrl: 'http://localhost:11434'
            });
            const saved = await provider.save();
            expect(saved.createdAt).toBeInstanceOf(Date);
            expect(saved.updatedAt).toBeInstanceOf(Date);
        });

        it('should update updatedAt on modification', async () => {
            const provider = new Provider({
                name: 'Update Test',
                type: PROVIDER_TYPES.OLLAMA,
                baseUrl: 'http://localhost:11434'
            });
            const saved = await provider.save();
            const originalUpdatedAt = saved.updatedAt;

            // Wait a bit to ensure timestamp difference
            await new Promise(resolve => setTimeout(resolve, 10));

            saved.baseUrl = 'http://localhost:11435';
            const updated = await saved.save();

            expect(updated.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
        });

        it('should trim whitespace from name', async () => {
            const provider = new Provider({
                name: '  Trimmed Name  ',
                type: PROVIDER_TYPES.OLLAMA,
                baseUrl: 'http://localhost:11434'
            });
            const saved = await provider.save();
            expect(saved.name).toBe('Trimmed Name');
        });

        it('should trim whitespace from baseUrl', async () => {
            const provider = new Provider({
                name: 'URL Trim Test',
                type: PROVIDER_TYPES.OLLAMA,
                baseUrl: '  http://localhost:11434  '
            });
            const saved = await provider.save();
            expect(saved.baseUrl).toBe('http://localhost:11434');
        });
    });
});
