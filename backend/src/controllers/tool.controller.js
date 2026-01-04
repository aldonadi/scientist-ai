const { z } = require('zod');
const Tool = require('../models/tool.model');

// Zod schema for tool validation
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

const createTool = async (req, res, next) => {
    try {
        // 1. Validate request body
        const validatedData = toolSchema.parse(req.body);

        // 2. Check for duplicate (Manual check for clearer error message, though DB index handles it too)
        const existingTool = await Tool.findOne({
            namespace: validatedData.namespace,
            name: validatedData.name
        });

        if (existingTool) {
            return res.status(409).json({
                error: 'Conflict',
                message: `Tool '${validatedData.name}' already exists in namespace '${validatedData.namespace}'`
            });
        }

        // 3. Create and Save Tool
        const tool = new Tool(validatedData);
        await tool.save();

        // 4. Return success
        res.status(201).json(tool);

    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                error: 'Bad Request',
                details: error.errors
            });
        }
        next(error);
    }
};

module.exports = {
    createTool
};
