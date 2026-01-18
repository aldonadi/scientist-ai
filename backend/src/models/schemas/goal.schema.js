const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Goal Schema
 * Subdocument schema for Experiment Goals.
 * Defines termination conditions for an experiment.
 */
const GoalSchema = new Schema({
    description: {
        type: String,
        required: true,
        trim: true
    },
    conditionScript: {
        type: String,
        required: true,
        trim: true
    }
}, {
    _id: false, // subdocument
    timestamps: false
});

module.exports = { GoalSchema };
