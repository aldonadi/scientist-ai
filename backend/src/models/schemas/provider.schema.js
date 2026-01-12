const { z } = require('zod');
const { PROVIDER_TYPE_VALUES } = require('../provider.model');

/**
 * URL validation regex - validates protocol and hostname
 * Matches: http://hostname, https://hostname, http://hostname:port, https://hostname/path
 */
const URL_REGEX = /^https?:\/\/[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*(:\d+)?(\/.*)?$/;

/**
 * Zod validation schema for Provider creation.
 * All required fields must be present.
 */
const providerSchema = z.object({
    name: z.string()
        .min(1, 'Provider name is required')
        .trim(),
    type: z.enum(PROVIDER_TYPE_VALUES, {
        errorMap: () => ({
            message: `Provider type must be one of: ${PROVIDER_TYPE_VALUES.join(', ')}`
        })
    }),
    baseUrl: z.string()
        .min(1, 'Base URL is required')
        .regex(URL_REGEX, 'Base URL must be a valid URL with protocol (http:// or https://) and hostname')
        .trim(),
    apiKeyRef: z.string()
        .trim()
        .optional()
        .nullable()
});

/**
 * Zod validation schema for Provider updates.
 * All fields are optional but validated if present.
 */
const providerUpdateSchema = z.object({
    name: z.string()
        .min(1, 'Provider name cannot be empty')
        .trim()
        .optional(),
    type: z.enum(PROVIDER_TYPE_VALUES, {
        errorMap: () => ({
            message: `Provider type must be one of: ${PROVIDER_TYPE_VALUES.join(', ')}`
        })
    }).optional(),
    baseUrl: z.string()
        .min(1, 'Base URL cannot be empty')
        .regex(URL_REGEX, 'Base URL must be a valid URL with protocol (http:// or https://) and hostname')
        .trim()
        .optional(),
    apiKeyRef: z.string()
        .trim()
        .optional()
        .nullable()
});

module.exports = {
    providerSchema,
    providerUpdateSchema
};
