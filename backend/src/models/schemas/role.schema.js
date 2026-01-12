const mongoose = require('mongoose');
const { Schema } = mongoose;
const { ModelConfigSchema } = require('./modelConfig.schema');

/**
 * Role Schema
 * Subdocument schema for Agent Roles in an ExperimentPlan.
 * Defines the identity, capabilities, and configuration of an agent.
 */
const RoleSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    modelConfig: {
        type: ModelConfigSchema,
        required: true
    },
    systemPrompt: {
        type: String,
        default: ''
    },
    tools: [{
        type: Schema.Types.ObjectId,
        ref: 'Tool'
    }],
    variableWhitelist: [{
        type: String,
        trim: true
    }]
}, {
    _id: false, // Subdocument, typically doesn't need its own ID unless referenced directly
    timestamps: false
});

module.exports = { RoleSchema };
