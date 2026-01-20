/**
 * Settings Registry
 * 
 * Single source of truth for all application settings.
 * Each setting defines its key, type, default value, validation, and UI metadata.
 */

const { z } = require('zod');

/**
 * Schema version for export/import compatibility.
 * Increment when making breaking changes to setting keys or types.
 */
const SETTINGS_SCHEMA_VERSION = 1;

/**
 * Settings Registry
 * 
 * Each setting object has:
 * - key: Unique dot-notation identifier (e.g., 'providers.ollama.apiBaseUrl')
 * - name: Human-readable display name
 * - description: Help text for the UI
 * - type: 'string' | 'integer' | 'float' | 'boolean' | 'enum' | 'json'
 * - default: Default value
 * - tags: Array of searchable tags
 * - group: Array representing hierarchy (e.g., ['Providers', 'Ollama'])
 * - scope: 'global' | 'user' (user scope reserved for future multi-user support)
 * - advanced: If true, hidden by default in UI
 * - validator: Zod schema for validation
 * - options: (enum only) Array of allowed values
 * - helpText: (optional) Extended help text
 */
const settingsRegistry = [
    // === PROVIDERS > OLLAMA ===
    {
        key: 'providers.ollama.apiBaseUrl',
        name: 'API Base URL',
        description: 'Base URL for the Ollama API server',
        type: 'string',
        default: 'http://localhost:11434',
        tags: ['ollama', 'connection', 'api'],
        group: ['Providers', 'Ollama'],
        scope: 'global',
        advanced: false,
        validator: z.string().url('Must be a valid URL'),
    },
    {
        key: 'providers.ollama.contextLength',
        name: 'Context Length',
        description: 'Maximum context window size for model prompts',
        type: 'integer',
        default: 4096,
        tags: ['ollama', 'performance', 'context'],
        group: ['Providers', 'Ollama'],
        scope: 'global',
        advanced: false,
        validator: z.number().int('Must be an integer').min(2048, 'Minimum is 2048').max(131072, 'Maximum is 131072'),
    },
    {
        key: 'providers.ollama.modelOptions',
        name: 'Model Options',
        description: 'Additional JSON config options sent with model prompts (e.g., temperature, reasoning effort)',
        type: 'json',
        default: { temperature: 0.7 },
        tags: ['ollama', 'advanced', 'model'],
        group: ['Providers', 'Ollama'],
        scope: 'global',
        advanced: true,
        validator: z.record(z.any()).refine(
            (obj) => typeof obj === 'object' && obj !== null && !Array.isArray(obj),
            { message: 'Must be a valid JSON object' }
        ),
        helpText: 'JSON object with keys like: temperature, top_p, top_k, seed, num_predict, etc.',
    },
    {
        key: 'docker.containerPoolSize',
        name: 'Container Pool Size',
        description: 'Number of containers to keep in the pool',
        type: 'integer',
        default: 2,
        tags: ['docker', 'performance', 'container'],
        group: ['Docker'],
        scope: 'global',
        advanced: false,
        validator: z.number().int('Must be an integer').min(1, 'Minimum is 1').max(10, 'Maximum is 10'),
    },
];

/**
 * Get a setting definition by key
 * @param {string} key - The setting key
 * @returns {object|undefined} - The setting definition or undefined
 */
function getDefinition(key) {
    return settingsRegistry.find(s => s.key === key);
}

/**
 * Get all setting definitions
 * @returns {object[]} - Array of all setting definitions
 */
function getAllDefinitions() {
    return settingsRegistry;
}

/**
 * Build group tree from registry for UI navigation
 * @returns {object} - Nested tree structure of groups
 */
function buildGroupTree() {
    const tree = {};

    for (const setting of settingsRegistry) {
        let current = tree;
        for (const segment of setting.group) {
            if (!current[segment]) {
                current[segment] = { _settings: [], _children: {} };
            }
            current = current[segment]._children;
        }
    }

    return tree;
}

module.exports = {
    SETTINGS_SCHEMA_VERSION,
    settingsRegistry,
    getDefinition,
    getAllDefinitions,
    buildGroupTree,
};
