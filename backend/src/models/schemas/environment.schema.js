const mongoose = require('mongoose');

/**
 * Environment Schema - Embedded subdocument for experiment state
 * 
 * The Environment holds the state of an experiment step, including
 * variables and their type definitions.
 */
const environmentSchema = new mongoose.Schema({
    variables: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    variableTypes: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, { _id: false }); // Disable _id for embedded subdocuments

/**
 * Supported type validators
 * Maps type string to validation function
 */
const typeValidators = {
    string: (value) => typeof value === 'string',
    int: (value) => Number.isInteger(value),
    float: (value) => typeof value === 'number',
    bool: (value) => typeof value === 'boolean',
    array: (value) => Array.isArray(value),
    object: (value) => typeof value === 'object' && value !== null && !Array.isArray(value)
};

/**
 * Parse enum type definition
 * @param {string} typeStr - Type string like "enum:[A,B,C]"
 * @returns {string[]|null} - Array of valid values or null if not an enum
 */
function parseEnumType(typeStr) {
    if (!typeStr || !typeStr.startsWith('enum:')) {
        return null;
    }
    const match = typeStr.match(/^enum:\[([^\]]*)\]$/);
    if (!match) {
        return null;
    }
    return match[1].split(',').map(v => v.trim());
}

/**
 * Validate a value against a type definition
 * @param {*} value - The value to validate
 * @param {string} typeStr - The type string (e.g., 'string', 'int', 'enum:[A,B]')
 * @returns {{ valid: boolean, error?: string }}
 */
function validateType(value, typeStr) {
    if (!typeStr) {
        // No type defined, allow any value
        return { valid: true };
    }

    // Check for enum type
    const enumValues = parseEnumType(typeStr);
    if (enumValues) {
        if (enumValues.includes(value)) {
            return { valid: true };
        }
        return {
            valid: false,
            error: `Value "${value}" is not in enum [${enumValues.join(', ')}]`
        };
    }

    // Check for standard types
    const validator = typeValidators[typeStr];
    if (!validator) {
        // Unknown type, allow any value (or could throw error)
        return { valid: true };
    }

    if (validator(value)) {
        return { valid: true };
    }

    return {
        valid: false,
        error: `Value "${value}" is not a valid ${typeStr}`
    };
}

/**
 * Create a deep copy of an environment object
 * @param {Object} env - Environment object with variables and variableTypes
 * @returns {Object} - New environment object with detached state
 */
function deepCopy(env) {
    if (!env) {
        return { variables: {}, variableTypes: {} };
    }
    return {
        variables: JSON.parse(JSON.stringify(env.variables || {})),
        variableTypes: JSON.parse(JSON.stringify(env.variableTypes || {}))
    };
}

/**
 * Get a variable value from the environment
 * @param {Object} env - Environment object
 * @param {string} key - Variable name
 * @returns {*} - Variable value or undefined
 */
function get(env, key) {
    if (!env || !env.variables) {
        return undefined;
    }
    return env.variables[key];
}

/**
 * Set a variable value in the environment with type enforcement
 * @param {Object} env - Environment object (mutated in place)
 * @param {string} key - Variable name
 * @param {*} value - Value to set
 * @throws {Error} - If value doesn't match the defined type
 */
function set(env, key, value) {
    if (!env) {
        throw new Error('Environment is required');
    }
    if (!env.variables) {
        env.variables = {};
    }
    if (!env.variableTypes) {
        env.variableTypes = {};
    }

    const typeStr = env.variableTypes[key];
    const validation = validateType(value, typeStr);

    if (!validation.valid) {
        throw new Error(`Type validation failed for "${key}": ${validation.error}`);
    }

    env.variables[key] = value;
}

/**
 * Serialize environment to JSON
 * @param {Object} env - Environment object
 * @returns {Object} - Plain JavaScript object suitable for JSON serialization
 */
function toJSON(env) {
    if (!env) {
        return { variables: {}, variableTypes: {} };
    }
    return {
        variables: env.variables || {},
        variableTypes: env.variableTypes || {}
    };
}

module.exports = {
    environmentSchema,
    deepCopy,
    get,
    set,
    toJSON,
    validateType,
    parseEnumType
};
