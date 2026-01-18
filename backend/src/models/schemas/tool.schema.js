const { z } = require('zod');

/**
 * Zod validation schema for Tool creation.
 * All fields are required for creating a new tool.
 */
const toolSchema = z.object({
    namespace: z.string()
        .min(1, 'Namespace is required')
        .regex(/^[a-zA-Z0-9_]+$/, 'Namespace must be alphanumeric with underscores'),
    name: z.string()
        .min(1, 'Name is required')
        .regex(/^[a-zA-Z0-9_]+$/, 'Name must be alphanumeric with underscores'),
    description: z.string()
        .min(1, 'Description is required'),
    parameters: z.object({}).passthrough()
        .refine((data) => {
            // Basic JSON Schema structure check
            return typeof data === 'object' && data !== null;
        }, {
            message: "Parameters must be a valid JSON Schema object"
        }),
    code: z.string()
        .min(1, 'Code is required')
});

/**
 * Zod validation schema for Tool updates.
 * All fields are optional but validated if present.
 */
const toolUpdateSchema = z.object({
    namespace: z.string()
        .min(1, 'Namespace cannot be empty')
        .regex(/^[a-zA-Z0-9_]+$/, 'Namespace must be alphanumeric with underscores')
        .optional(),
    name: z.string()
        .min(1, 'Name cannot be empty')
        .regex(/^[a-zA-Z0-9_]+$/, 'Name must be alphanumeric with underscores')
        .optional(),
    description: z.string().optional(),
    parameters: z.object({}).passthrough()
        .refine((data) => {
            return typeof data === 'object' && data !== null;
        }, {
            message: "Parameters must be a valid JSON Schema object"
        })
        .optional(),
    code: z.string().optional()
});

module.exports = {
    toolSchema,
    toolUpdateSchema
};
