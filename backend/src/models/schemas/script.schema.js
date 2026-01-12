const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Script Schema
 * Subdocument schema for Event Scripts (Hooks).
 * Defines code to execute on specific lifecycle events.
 */
const ScriptSchema = new Schema({
    hookType: {
        type: String,
        required: true,
        enum: [
            'EXPERIMENT_START',
            'STEP_START',
            'ROLE_START',
            'MODEL_PROMPT',
            'MODEL_RESPONSE_CHUNK',
            'MODEL_RESPONSE_COMPLETE',
            'TOOL_CALL',
            'TOOL_RESULT',
            'STEP_END',
            'EXPERIMENT_END',
            'LOG',
            'BEFORE_TOOL_CALL',
            'AFTER_TOOL_CALL'
        ]
    },
    code: {
        type: String,
        required: true
    },
    failPolicy: {
        type: String,
        enum: ['ABORT_EXPERIMENT', 'CONTINUE_WITH_ERROR'],
        default: 'ABORT_EXPERIMENT'
    },
    executionMode: {
        type: String,
        enum: ['SYNC', 'ASYNC'],
        default: 'SYNC'
    }
}, {
    _id: false, // subdocument
    timestamps: false
});

module.exports = { ScriptSchema };

