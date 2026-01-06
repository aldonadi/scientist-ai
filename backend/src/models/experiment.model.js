const mongoose = require('mongoose');
const { Schema } = mongoose;
const { environmentSchema } = require('./schemas/environment.schema');

/**
 * Experiment Schema
 * Represents a running or completed instance of an ExperimentPlan.
 */
const ExperimentSchema = new Schema({
    planId: {
        type: Schema.Types.ObjectId,
        ref: 'ExperimentPlan',
        required: true,
        index: true
    },
    status: {
        type: String,
        enum: ['INITIALIZING', 'RUNNING', 'PAUSED', 'COMPLETED', 'FAILED'],
        default: 'INITIALIZING',
        index: true,
        required: true
    },
    currentStep: {
        type: Number,
        default: 0,
        min: 0
    },
    currentEnvironment: {
        type: environmentSchema,
        default: () => ({ variables: {}, variableTypes: {} })
    },
    startTime: {
        type: Date,
        default: Date.now
    },
    endTime: {
        type: Date
    },
    result: {
        type: String
    }
}, {
    timestamps: true
});

// Indexes are defined in the schema with index: true



const Experiment = mongoose.model('Experiment', ExperimentSchema);

module.exports = { Experiment };
