const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const {
    ISettingsStore,
    MongoDBSettingsStore,
    SettingsService,
    SETTINGS_SCHEMA_VERSION,
    getDefinition,
    getAllDefinitions,
    resetSettingsService,
} = require('../../../src/services/settings');

describe('Settings System', () => {
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
        // Clear all settings between tests
        const collections = mongoose.connection.collections;
        for (const key in collections) {
            await collections[key].deleteMany({});
        }
        resetSettingsService();
    });

    describe('ISettingsStore Interface', () => {
        it('should throw "not implemented" errors for all methods', async () => {
            const store = new ISettingsStore();

            await expect(store.get('key')).rejects.toThrow('not implemented');
            await expect(store.set('key', 'value')).rejects.toThrow('not implemented');
            await expect(store.delete('key')).rejects.toThrow('not implemented');
            await expect(store.getAll()).rejects.toThrow('not implemented');
            await expect(store.deleteAll()).rejects.toThrow('not implemented');
        });
    });

    describe('MongoDBSettingsStore', () => {
        let store;

        beforeEach(() => {
            store = new MongoDBSettingsStore();
        });

        describe('set() and get()', () => {
            it('should store and retrieve a string value', async () => {
                await store.set('test.key', 'test-value');
                const result = await store.get('test.key');
                expect(result).toBe('test-value');
            });

            it('should store and retrieve a number value', async () => {
                await store.set('test.number', 42);
                const result = await store.get('test.number');
                expect(result).toBe(42);
            });

            it('should store and retrieve an object value', async () => {
                const obj = { foo: 'bar', nested: { baz: 123 } };
                await store.set('test.object', obj);
                const result = await store.get('test.object');
                expect(result).toEqual(obj);
            });

            it('should return null for non-existent key', async () => {
                const result = await store.get('nonexistent.key');
                expect(result).toBeNull();
            });

            it('should update existing value', async () => {
                await store.set('test.key', 'value1');
                await store.set('test.key', 'value2');
                const result = await store.get('test.key');
                expect(result).toBe('value2');
            });

            it('should throw for empty key', async () => {
                await expect(store.set('', 'value')).rejects.toThrow('Key must be a non-empty string');
            });

            it('should throw for undefined value', async () => {
                await expect(store.set('test.key', undefined)).rejects.toThrow('Value cannot be undefined');
            });
        });

        describe('delete()', () => {
            it('should delete an existing setting and return true', async () => {
                await store.set('test.key', 'value');
                const result = await store.delete('test.key');
                expect(result).toBe(true);
                expect(await store.get('test.key')).toBeNull();
            });

            it('should return false for non-existent key', async () => {
                const result = await store.delete('nonexistent.key');
                expect(result).toBe(false);
            });
        });

        describe('getAll()', () => {
            it('should return all stored settings', async () => {
                await store.set('key1', 'value1');
                await store.set('key2', 42);
                await store.set('key3', { foo: 'bar' });

                const result = await store.getAll();
                expect(result).toEqual({
                    key1: 'value1',
                    key2: 42,
                    key3: { foo: 'bar' },
                });
            });

            it('should return empty object when no settings', async () => {
                const result = await store.getAll();
                expect(result).toEqual({});
            });
        });

        describe('deleteAll()', () => {
            it('should delete all settings and return count', async () => {
                await store.set('key1', 'value1');
                await store.set('key2', 'value2');
                await store.set('key3', 'value3');

                const count = await store.deleteAll();
                expect(count).toBe(3);
                expect(await store.getAll()).toEqual({});
            });

            it('should return 0 when no settings to delete', async () => {
                const count = await store.deleteAll();
                expect(count).toBe(0);
            });
        });
    });

    describe('Settings Registry', () => {
        it('should have a schema version', () => {
            expect(SETTINGS_SCHEMA_VERSION).toBe(1);
        });

        it('should return definition by key', () => {
            const def = getDefinition('providers.ollama.apiBaseUrl');
            expect(def).toBeDefined();
            expect(def.name).toBe('API Base URL');
            expect(def.type).toBe('string');
        });

        it('should return undefined for unknown key', () => {
            const def = getDefinition('unknown.setting');
            expect(def).toBeUndefined();
        });

        it('should return all definitions', () => {
            const defs = getAllDefinitions();
            expect(Array.isArray(defs)).toBe(true);
            expect(defs.length).toBeGreaterThanOrEqual(3);
        });
    });

    describe('SettingsService', () => {
        let service;
        let store;

        beforeEach(() => {
            store = new MongoDBSettingsStore();
            service = new SettingsService(store);
        });

        describe('get()', () => {
            it('should return default value when not stored', async () => {
                const value = await service.get('providers.ollama.apiBaseUrl');
                expect(value).toBe('http://localhost:11434');
            });

            it('should return stored value when set', async () => {
                await store.set('providers.ollama.apiBaseUrl', 'http://custom:8080');
                const value = await service.get('providers.ollama.apiBaseUrl');
                expect(value).toBe('http://custom:8080');
            });

            it('should throw for unknown setting', async () => {
                await expect(service.get('unknown.setting')).rejects.toThrow('Unknown setting');
            });
        });

        describe('set()', () => {
            it('should store valid value and return success', async () => {
                const result = await service.set('providers.ollama.apiBaseUrl', 'http://example.com');
                expect(result.success).toBe(true);

                const stored = await store.get('providers.ollama.apiBaseUrl');
                expect(stored).toBe('http://example.com');
            });

            it('should reject invalid value and return errors', async () => {
                const result = await service.set('providers.ollama.apiBaseUrl', 'not-a-url');
                expect(result.success).toBe(false);
                expect(result.errors).toBeDefined();
                expect(result.errors.length).toBeGreaterThan(0);
            });

            it('should reject out-of-range integer', async () => {
                const result = await service.set('providers.ollama.contextLength', 500);
                expect(result.success).toBe(false);
                expect(result.errors[0].message).toContain('2048');
            });

            it('should return error for unknown setting', async () => {
                const result = await service.set('unknown.setting', 'value');
                expect(result.success).toBe(false);
                expect(result.errors[0].message).toContain('Unknown setting');
            });
        });

        describe('validate()', () => {
            it('should return valid for correct value', () => {
                const result = service.validate('providers.ollama.contextLength', 8192);
                expect(result.valid).toBe(true);
            });

            it('should return invalid with errors for wrong type', () => {
                const result = service.validate('providers.ollama.contextLength', 'not-a-number');
                expect(result.valid).toBe(false);
                expect(result.errors.length).toBeGreaterThan(0);
            });
        });

        describe('reset()', () => {
            it('should delete stored value and return true', async () => {
                await store.set('providers.ollama.contextLength', 8192);
                const result = await service.reset('providers.ollama.contextLength');
                expect(result).toBe(true);

                const value = await service.get('providers.ollama.contextLength');
                expect(value).toBe(4096); // default
            });

            it('should return false when already at default', async () => {
                const result = await service.reset('providers.ollama.contextLength');
                expect(result).toBe(false);
            });
        });

        describe('resetAll()', () => {
            it('should delete all stored settings', async () => {
                await store.set('providers.ollama.apiBaseUrl', 'http://custom');
                await store.set('providers.ollama.contextLength', 8192);

                const count = await service.resetAll();
                expect(count).toBe(2);

                // Should return defaults
                expect(await service.get('providers.ollama.apiBaseUrl')).toBe('http://localhost:11434');
                expect(await service.get('providers.ollama.contextLength')).toBe(4096);
            });
        });

        describe('getAll()', () => {
            it('should return all settings with values and isDefault flag', async () => {
                await store.set('providers.ollama.contextLength', 8192);

                const all = await service.getAll();
                expect(Array.isArray(all)).toBe(true);

                const contextLength = all.find(s => s.key === 'providers.ollama.contextLength');
                expect(contextLength.value).toBe(8192);
                expect(contextLength.isDefault).toBe(false);

                const apiUrl = all.find(s => s.key === 'providers.ollama.apiBaseUrl');
                expect(apiUrl.value).toBe('http://localhost:11434');
                expect(apiUrl.isDefault).toBe(true);
            });
        });

        describe('getDefinitions()', () => {
            it('should return serialized definitions without validators', () => {
                const defs = service.getDefinitions();
                expect(Array.isArray(defs)).toBe(true);

                for (const def of defs) {
                    expect(def.validator).toBeUndefined();
                    expect(def.key).toBeDefined();
                    expect(def.name).toBeDefined();
                }
            });
        });

        describe('exportSettings()', () => {
            it('should export with schema version', async () => {
                await store.set('providers.ollama.contextLength', 8192);

                const exported = await service.exportSettings();
                expect(exported.schemaVersion).toBe(SETTINGS_SCHEMA_VERSION);
                expect(exported.exportedAt).toBeDefined();
                expect(exported.settings['providers.ollama.contextLength']).toBe(8192);
            });
        });

        describe('importSettings()', () => {
            it('should import valid settings', async () => {
                const data = {
                    schemaVersion: 1,
                    settings: {
                        'providers.ollama.contextLength': 16384,
                    },
                };

                const result = await service.importSettings(data);
                expect(result.imported).toBe(1);
                expect(result.skipped).toBe(0);

                const value = await service.get('providers.ollama.contextLength');
                expect(value).toBe(16384);
            });

            it('should skip unknown settings', async () => {
                const data = {
                    schemaVersion: 1,
                    settings: {
                        'unknown.setting': 'value',
                    },
                };

                const result = await service.importSettings(data);
                expect(result.imported).toBe(0);
                expect(result.skipped).toBe(1);
                expect(result.errors.length).toBe(1);
            });

            it('should skip invalid values', async () => {
                const data = {
                    schemaVersion: 1,
                    settings: {
                        'providers.ollama.contextLength': 500, // too low
                    },
                };

                const result = await service.importSettings(data);
                expect(result.imported).toBe(0);
                expect(result.skipped).toBe(1);
            });

            it('should reject import with newer schema version', async () => {
                const data = {
                    schemaVersion: 999,
                    settings: {},
                };

                const result = await service.importSettings(data);
                expect(result.errors.length).toBeGreaterThan(0);
                expect(result.errors[0]).toContain('newer');
            });
        });
    });
});
