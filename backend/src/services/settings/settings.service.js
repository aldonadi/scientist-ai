const { z } = require('zod');
const {
    SETTINGS_SCHEMA_VERSION,
    settingsRegistry,
    getDefinition,
    getAllDefinitions,
} = require('./settings.registry');

/**
 * Settings Service
 * 
 * Core service for managing application settings.
 * Handles validation, default values, and storage operations.
 */
class SettingsService {
    /**
     * @param {ISettingsStore} store - The storage backend
     */
    constructor(store) {
        this.store = store;
    }

    /**
     * Get a setting value (from store or default).
     * @param {string} key - The setting key
     * @param {object} scope - Optional scope
     * @returns {Promise<any>} - The current value
     */
    async get(key, scope = {}) {
        const definition = getDefinition(key);
        if (!definition) {
            throw new Error(`Unknown setting: ${key}`);
        }

        const storedValue = await this.store.get(key, scope);
        return storedValue !== null ? storedValue : definition.default;
    }

    /**
     * Set a setting value (with validation).
     * @param {string} key - The setting key
     * @param {any} value - The value to set
     * @param {object} scope - Optional scope
     * @returns {Promise<{ success: boolean, errors?: object[] }>}
     */
    async set(key, value, scope = {}) {
        const definition = getDefinition(key);
        if (!definition) {
            return { success: false, errors: [{ message: `Unknown setting: ${key}` }] };
        }

        // Validate
        const validation = this.validate(key, value);
        if (!validation.valid) {
            return { success: false, errors: validation.errors };
        }

        // Store
        await this.store.set(key, value, scope);
        return { success: true };
    }

    /**
     * Validate a value against a setting's validator.
     * @param {string} key - The setting key
     * @param {any} value - The value to validate
     * @returns {{ valid: boolean, errors?: object[] }}
     */
    validate(key, value) {
        const definition = getDefinition(key);
        if (!definition) {
            return { valid: false, errors: [{ message: `Unknown setting: ${key}` }] };
        }

        try {
            definition.validator.parse(value);
            return { valid: true };
        } catch (error) {
            if (error instanceof z.ZodError) {
                return {
                    valid: false,
                    errors: error.issues.map(e => ({
                        path: e.path.join('.'),
                        message: e.message,
                    })),
                };
            }
            return { valid: false, errors: [{ message: error.message }] };
        }
    }

    /**
     * Reset a setting to its default value.
     * @param {string} key - The setting key
     * @param {object} scope - Optional scope
     * @returns {Promise<boolean>} - True if was stored, false if already default
     */
    async reset(key, scope = {}) {
        const definition = getDefinition(key);
        if (!definition) {
            throw new Error(`Unknown setting: ${key}`);
        }

        return await this.store.delete(key, scope);
    }

    /**
     * Reset all settings to defaults.
     * @param {object} scope - Optional scope
     * @returns {Promise<number>} - Number of settings reset
     */
    async resetAll(scope = {}) {
        return await this.store.deleteAll(scope);
    }

    /**
     * Get all settings with current values.
     * @param {object} scope - Optional scope
     * @returns {Promise<object[]>} - Array of settings with values
     */
    async getAll(scope = {}) {
        const storedValues = await this.store.getAll(scope);

        return settingsRegistry.map(definition => ({
            ...this._serializeDefinition(definition),
            value: storedValues[definition.key] !== undefined
                ? storedValues[definition.key]
                : definition.default,
            isDefault: storedValues[definition.key] === undefined,
        }));
    }

    /**
     * Get all setting definitions (for UI rendering).
     * @returns {object[]} - Array of serialized definitions
     */
    getDefinitions() {
        return settingsRegistry.map(d => this._serializeDefinition(d));
    }

    /**
     * Get a single definition.
     * @param {string} key - The setting key
     * @returns {object|null}
     */
    getDefinition(key) {
        const def = getDefinition(key);
        return def ? this._serializeDefinition(def) : null;
    }

    /**
     * Export all settings as JSON.
     * @param {object} scope - Optional scope
     * @returns {Promise<object>} - Export object with version and settings
     */
    async exportSettings(scope = {}) {
        const storedValues = await this.store.getAll(scope);
        return {
            schemaVersion: SETTINGS_SCHEMA_VERSION,
            exportedAt: new Date().toISOString(),
            settings: storedValues,
        };
    }

    /**
     * Import settings from JSON.
     * @param {object} data - Import object with schemaVersion and settings
     * @param {object} scope - Optional scope
     * @returns {Promise<{ imported: number, skipped: number, errors: string[] }>}
     */
    async importSettings(data, scope = {}) {
        const result = { imported: 0, skipped: 0, errors: [] };

        if (!data || typeof data !== 'object') {
            result.errors.push('Invalid import data');
            return result;
        }

        const { schemaVersion, settings } = data;

        // TODO: Add migration logic when schema version changes
        if (schemaVersion && schemaVersion > SETTINGS_SCHEMA_VERSION) {
            result.errors.push(`Import schema version ${schemaVersion} is newer than current ${SETTINGS_SCHEMA_VERSION}`);
            return result;
        }

        if (!settings || typeof settings !== 'object') {
            result.errors.push('No settings found in import data');
            return result;
        }

        for (const [key, value] of Object.entries(settings)) {
            const definition = getDefinition(key);
            if (!definition) {
                result.skipped++;
                result.errors.push(`Unknown setting skipped: ${key}`);
                continue;
            }

            const validation = this.validate(key, value);
            if (!validation.valid) {
                result.skipped++;
                result.errors.push(`Invalid value for ${key}: ${validation.errors.map(e => e.message).join(', ')}`);
                continue;
            }

            await this.store.set(key, value, scope);
            result.imported++;
        }

        return result;
    }

    /**
     * Serialize a definition for API response (removes Zod validator).
     * @private
     */
    _serializeDefinition(definition) {
        const { validator, ...rest } = definition;

        // Extract validation metadata from Zod schema for frontend use
        const validationMeta = this._extractValidationMeta(definition);

        return {
            ...rest,
            validation: validationMeta,
        };
    }

    /**
     * Extract validation metadata from Zod schema.
     * @private
     */
    _extractValidationMeta(definition) {
        const meta = { required: true };

        // Try to extract min/max from Zod schema checks
        try {
            const checks = definition.validator._def?.checks || [];
            for (const check of checks) {
                if (check.kind === 'min') meta.min = check.value;
                if (check.kind === 'max') meta.max = check.value;
            }
        } catch {
            // Ignore extraction errors
        }

        return meta;
    }
}

module.exports = SettingsService;
