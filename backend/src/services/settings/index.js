/**
 * Settings Module
 * 
 * Provides a comprehensive settings management system with:
 * - Declarative registry of settings with validation
 * - Pluggable storage backends
 * - Export/import functionality
 * 
 * Usage:
 *   const { SettingsService, MongoDBSettingsStore } = require('./services/settings');
 *   const store = new MongoDBSettingsStore();
 *   const settings = new SettingsService(store);
 *   
 *   const value = await settings.get('providers.ollama.apiBaseUrl');
 *   await settings.set('providers.ollama.contextLength', 8192);
 */

const ISettingsStore = require('./settings-store.interface');
const MongoDBSettingsStore = require('./mongodb-settings-store');
const SettingsService = require('./settings.service');
const {
    SETTINGS_SCHEMA_VERSION,
    settingsRegistry,
    getDefinition,
    getAllDefinitions,
    buildGroupTree,
} = require('./settings.registry');

// Singleton instance for the app
let _settingsService = null;

/**
 * Get the singleton SettingsService instance.
 * Creates one with MongoDBSettingsStore if not exists.
 */
function getSettingsService() {
    if (!_settingsService) {
        const store = new MongoDBSettingsStore();
        _settingsService = new SettingsService(store);
    }
    return _settingsService;
}

/**
 * Reset the singleton (for testing).
 */
function resetSettingsService() {
    _settingsService = null;
}

module.exports = {
    ISettingsStore,
    MongoDBSettingsStore,
    SettingsService,
    SETTINGS_SCHEMA_VERSION,
    settingsRegistry,
    getDefinition,
    getAllDefinitions,
    buildGroupTree,
    getSettingsService,
    resetSettingsService,
};
