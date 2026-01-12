const mongoose = require('mongoose');

/**
 * Valid provider types - single source of truth for the application.
 * When adding a new provider, add the type here first.
 */
const PROVIDER_TYPES = Object.freeze({
    OLLAMA: 'OLLAMA',
    OPENAI: 'OPENAI',
    ANTHROPIC: 'ANTHROPIC',
    GENERIC_OPENAI: 'GENERIC_OPENAI'
});

/**
 * Array of valid provider type values for schema validation
 */
const PROVIDER_TYPE_VALUES = Object.values(PROVIDER_TYPES);

/**
 * URL validation regex - validates protocol and hostname
 * Matches: http://hostname, https://hostname, http://hostname:port, https://hostname/path
 * RFC 3986 compliant for the scheme and authority components
 */
const URL_REGEX = /^https?:\/\/[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*(:\d+)?(\/.*)?$/;

/**
 * Provider Schema - Represents an LLM backend connection
 * 
 * Providers interface between this application and LLM backend drivers
 * such as Ollama, OpenAI, Anthropic, etc.
 */
const providerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Provider name is required'],
        trim: true
    },
    type: {
        type: String,
        required: [true, 'Provider type is required'],
        enum: {
            values: PROVIDER_TYPE_VALUES,
            message: '{VALUE} is not a valid provider type. Valid types are: ' + PROVIDER_TYPE_VALUES.join(', ')
        }
    },
    baseUrl: {
        type: String,
        required: [true, 'Base URL is required'],
        trim: true,
        validate: {
            validator: function (v) {
                return URL_REGEX.test(v);
            },
            message: props => `${props.value} is not a valid URL. URL must include protocol (http:// or https://) and hostname.`
        }
    },
    apiKeyRef: {
        type: String,
        default: null,
        trim: true
    }
}, {
    timestamps: true
});

// Unique index on name - provider names are globally unique
providerSchema.index({ name: 1 }, { unique: true });

const Provider = mongoose.model('Provider', providerSchema);

module.exports = {
    Provider,
    PROVIDER_TYPES,
    PROVIDER_TYPE_VALUES,
    URL_REGEX
};
