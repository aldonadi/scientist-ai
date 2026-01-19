/**
 * @interface ISettingsStore
 * Abstract interface for settings storage backends.
 *
 * Implementations provide persistent storage for user settings.
 * The interface allows for pluggable backends (MongoDB, SQLite, flat files, etc.)
 */
class ISettingsStore {
    /**
     * Get a setting value.
     * @param {string} key - The setting key.
     * @param {object} scope - Optional scope (e.g., { userId: '123' })
     * @returns {Promise<any|null>} - The stored value, or null if not found.
     */
    async get(key, scope = {}) {
        throw new Error('ISettingsStore.get() not implemented');
    }

    /**
     * Store a setting value.
     * @param {string} key - The setting key.
     * @param {any} value - The value to store.
     * @param {object} scope - Optional scope (e.g., { userId: '123' })
     * @returns {Promise<void>}
     */
    async set(key, value, scope = {}) {
        throw new Error('ISettingsStore.set() not implemented');
    }

    /**
     * Delete a setting (reset to default).
     * @param {string} key - The setting key.
     * @param {object} scope - Optional scope
     * @returns {Promise<boolean>} - True if deleted, false if not found.
     */
    async delete(key, scope = {}) {
        throw new Error('ISettingsStore.delete() not implemented');
    }

    /**
     * Get all stored settings.
     * @param {object} scope - Optional scope
     * @returns {Promise<object>} - Object mapping keys to values.
     */
    async getAll(scope = {}) {
        throw new Error('ISettingsStore.getAll() not implemented');
    }

    /**
     * Delete all settings (factory reset).
     * @param {object} scope - Optional scope
     * @returns {Promise<number>} - Number of settings deleted.
     */
    async deleteAll(scope = {}) {
        throw new Error('ISettingsStore.deleteAll() not implemented');
    }
}

module.exports = ISettingsStore;
