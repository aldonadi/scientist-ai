const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const {
    ISecretStore,
    SecretStoreFactory,
    PlaintextInsecureNightmareSecretStore
} = require('../../../src/services/secrets');

describe('Secret Storage', () => {
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
        // Clear all secrets between tests
        const collections = mongoose.connection.collections;
        for (const key in collections) {
            await collections[key].deleteMany({});
        }
        // Reset factory singleton
        SecretStoreFactory.reset();
    });

    describe('ISecretStore Interface', () => {
        it('should throw "not implemented" errors for all methods', async () => {
            const store = new ISecretStore();

            await expect(store.store('key', 'value'))
                .rejects.toThrow('not implemented');
            await expect(store.retrieve('key'))
                .rejects.toThrow('not implemented');
            await expect(store.delete('key'))
                .rejects.toThrow('not implemented');
            await expect(store.exists('key'))
                .rejects.toThrow('not implemented');
        });
    });

    describe('PlaintextInsecureNightmareSecretStore', () => {
        let store;

        beforeEach(() => {
            // Suppress console.warn for tests
            jest.spyOn(console, 'warn').mockImplementation(() => { });
            store = new PlaintextInsecureNightmareSecretStore();
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('should log a warning on instantiation', () => {
            jest.restoreAllMocks();
            const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });
            new PlaintextInsecureNightmareSecretStore();
            expect(warnSpy).toHaveBeenCalled();
            expect(warnSpy.mock.calls[0][0]).toContain('WARNING');
            expect(warnSpy.mock.calls[0][0]).toContain('PlaintextInsecureNightmareSecretStore');
        });

        describe('store()', () => {
            it('should store a secret and return the key', async () => {
                const result = await store.store('my-key', 'my-secret-value');
                expect(result).toBe('my-key');
            });

            it('should upsert existing secrets', async () => {
                await store.store('my-key', 'value1');
                await store.store('my-key', 'value2');
                const retrieved = await store.retrieve('my-key');
                expect(retrieved).toBe('value2');
            });

            it('should throw if key is empty', async () => {
                await expect(store.store('', 'value'))
                    .rejects.toThrow('Key must be a non-empty string');
            });

            it('should throw if key is not a string', async () => {
                await expect(store.store(123, 'value'))
                    .rejects.toThrow('Key must be a non-empty string');
            });

            it('should throw if value is null', async () => {
                await expect(store.store('key', null))
                    .rejects.toThrow('Value cannot be null or undefined');
            });

            it('should throw if value is undefined', async () => {
                await expect(store.store('key', undefined))
                    .rejects.toThrow('Value cannot be null or undefined');
            });

            it('should convert non-string values to strings', async () => {
                await store.store('number-key', 12345);
                const retrieved = await store.retrieve('number-key');
                expect(retrieved).toBe('12345');
            });
        });

        describe('retrieve()', () => {
            it('should retrieve a stored secret', async () => {
                await store.store('test-key', 'test-value');
                const result = await store.retrieve('test-key');
                expect(result).toBe('test-value');
            });

            it('should return null for non-existent key', async () => {
                const result = await store.retrieve('non-existent-key');
                expect(result).toBeNull();
            });

            it('should return null for invalid key types', async () => {
                const result = await store.retrieve(null);
                expect(result).toBeNull();
            });

            it('should return null for empty key', async () => {
                const result = await store.retrieve('');
                expect(result).toBeNull();
            });
        });

        describe('exists()', () => {
            it('should return true for existing secret', async () => {
                await store.store('exists-key', 'value');
                const result = await store.exists('exists-key');
                expect(result).toBe(true);
            });

            it('should return false for non-existent key', async () => {
                const result = await store.exists('does-not-exist');
                expect(result).toBe(false);
            });

            it('should return false for invalid key types', async () => {
                const result = await store.exists(null);
                expect(result).toBe(false);
            });

            it('should return false for empty key', async () => {
                const result = await store.exists('');
                expect(result).toBe(false);
            });
        });

        describe('delete()', () => {
            it('should delete an existing secret and return true', async () => {
                await store.store('delete-key', 'value');
                const result = await store.delete('delete-key');
                expect(result).toBe(true);
            });

            it('should return false when deleting non-existent key', async () => {
                const result = await store.delete('non-existent');
                expect(result).toBe(false);
            });

            it('should make the key no longer exist after deletion', async () => {
                await store.store('delete-key', 'value');
                await store.delete('delete-key');
                const exists = await store.exists('delete-key');
                expect(exists).toBe(false);
            });

            it('should return false for invalid key types', async () => {
                const result = await store.delete(null);
                expect(result).toBe(false);
            });

            it('should return false for empty key', async () => {
                const result = await store.delete('');
                expect(result).toBe(false);
            });
        });
    });

    describe('SecretStoreFactory', () => {
        beforeEach(() => {
            jest.spyOn(console, 'warn').mockImplementation(() => { });
            delete process.env.SECRET_STORE_TYPE;
        });

        afterEach(() => {
            jest.restoreAllMocks();
            delete process.env.SECRET_STORE_TYPE;
        });

        it('should return PlaintextInsecureNightmareSecretStore when SECRET_STORE_TYPE is unset', () => {
            const store = SecretStoreFactory.getStore();
            expect(store).toBeInstanceOf(PlaintextInsecureNightmareSecretStore);
        });

        it('should return PlaintextInsecureNightmareSecretStore when SECRET_STORE_TYPE is "plaintext"', () => {
            process.env.SECRET_STORE_TYPE = 'plaintext';
            const store = SecretStoreFactory.getStore();
            expect(store).toBeInstanceOf(PlaintextInsecureNightmareSecretStore);
        });

        it('should return the same instance on multiple calls (singleton)', () => {
            const store1 = SecretStoreFactory.getStore();
            const store2 = SecretStoreFactory.getStore();
            expect(store1).toBe(store2);
        });

        it('should throw for unknown store type', () => {
            process.env.SECRET_STORE_TYPE = 'unknown-type';
            expect(() => SecretStoreFactory.getStore())
                .toThrow("Unknown SECRET_STORE_TYPE: 'unknown-type'");
        });

        it('should reset singleton when reset() is called', () => {
            const store1 = SecretStoreFactory.getStore();
            SecretStoreFactory.reset();
            const store2 = SecretStoreFactory.getStore();
            expect(store1).not.toBe(store2);
        });

        it('should create new instance if store type changes', () => {
            process.env.SECRET_STORE_TYPE = 'plaintext';
            const store1 = SecretStoreFactory.getStore();

            // This simulates what would happen if we added another store type
            SecretStoreFactory.reset();
            process.env.SECRET_STORE_TYPE = 'plaintext';
            const store2 = SecretStoreFactory.getStore();

            // After reset, should be different instance
            expect(store1).not.toBe(store2);
        });
    });

    describe('Integration: Full Secret Lifecycle', () => {
        let store;

        beforeEach(() => {
            jest.spyOn(console, 'warn').mockImplementation(() => { });
            store = SecretStoreFactory.getStore();
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('should handle complete store -> retrieve -> delete -> verify lifecycle', async () => {
            // Store
            const key = 'api-key-123';
            const value = 'super-secret-api-key';
            await store.store(key, value);

            // Verify exists
            expect(await store.exists(key)).toBe(true);

            // Retrieve
            const retrieved = await store.retrieve(key);
            expect(retrieved).toBe(value);

            // Delete
            const deleted = await store.delete(key);
            expect(deleted).toBe(true);

            // Verify no longer exists
            expect(await store.exists(key)).toBe(false);
            expect(await store.retrieve(key)).toBeNull();
        });

        it('should handle multiple secrets independently', async () => {
            await store.store('key1', 'value1');
            await store.store('key2', 'value2');
            await store.store('key3', 'value3');

            expect(await store.retrieve('key1')).toBe('value1');
            expect(await store.retrieve('key2')).toBe('value2');
            expect(await store.retrieve('key3')).toBe('value3');

            await store.delete('key2');

            expect(await store.exists('key1')).toBe(true);
            expect(await store.exists('key2')).toBe(false);
            expect(await store.exists('key3')).toBe(true);
        });
    });
});
