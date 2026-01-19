const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * ExperimentStateHistory Schema
 * Stores a snapshot of the environment variables at the end of a specific step.
 * Used for the "State History" tab in the frontend.
 */
const ExperimentStateHistorySchema = new Schema({
    experimentId: {
        type: Schema.Types.ObjectId,
        ref: 'Experiment',
        required: true,
        index: true
    },
    stepNumber: {
        type: Number,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    environment: {
        type: Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

// Compound index for efficient lookup of a specific step's state
ExperimentStateHistorySchema.index({ experimentId: 1, stepNumber: 1 }, { unique: true });

const ExperimentStateHistory = mongoose.model('ExperimentStateHistory', ExperimentStateHistorySchema);

module.exports = { ExperimentStateHistory };
