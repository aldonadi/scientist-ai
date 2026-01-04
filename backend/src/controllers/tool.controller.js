const { z } = require('zod');
const mongoose = require('mongoose');
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

const listTools = async (req, res, next) => {
    try {
        const filter = {};
        if (req.query.namespace) {
            filter.namespace = req.query.namespace;
        }

        const tools = await Tool.find(filter);
        res.status(200).json(tools);
    } catch (error) {
        next(error);
    }
};

const getTool = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Invalid tool ID format'
            });
        }

        const tool = await Tool.findById(id);

        if (!tool) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Tool not found'
            });
        }

        res.status(200).json(tool);
    } catch (error) {
        next(error);
    }
};

// Partial schema for updates - all fields optional but validated if present
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

const updateTool = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Invalid tool ID format'
            });
        }

        // Validate request body
        const validatedData = toolUpdateSchema.parse(req.body);

        // Check if tool exists first
        const existingTool = await Tool.findById(id);
        if (!existingTool) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Tool not found'
            });
        }

        // Check for duplicate name/namespace if either is being updated
        const newNamespace = validatedData.namespace || existingTool.namespace;
        const newName = validatedData.name || existingTool.name;

        if (validatedData.namespace || validatedData.name) {
            const duplicateTool = await Tool.findOne({
                namespace: newNamespace,
                name: newName,
                _id: { $ne: id }
            });

            if (duplicateTool) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: `Tool '${newName}' already exists in namespace '${newNamespace}'`
                });
            }
        }

        // Update the tool
        const updatedTool = await Tool.findByIdAndUpdate(
            id,
            validatedData,
            { new: true, runValidators: true }
        );

        res.status(200).json(updatedTool);

    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                error: 'Bad Request',
                details: error.errors
            });
        }
        // Handle MongoDB duplicate key error (should be caught above, but as fallback)
        if (error.code === 11000) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'A tool with this name and namespace already exists'
            });
        }
        next(error);
    }
};

const deleteTool = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Invalid tool ID format'
            });
        }

        const deletedTool = await Tool.findByIdAndDelete(id);

        if (!deletedTool) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Tool not found'
            });
        }

        // Log the destructive action
        console.log(`Tool deleted: ${deletedTool.namespace}/${deletedTool.name} (ID: ${id})`);

        res.status(200).json({
            message: 'Tool deleted successfully',
            id: id
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    createTool,
    listTools,
    getTool,
    updateTool,
    deleteTool
};
