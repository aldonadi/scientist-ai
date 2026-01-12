const mongoose = require('mongoose');
const { Schema } = mongoose;

const { environmentSchema } = require('./schemas/environment.schema');
const { RoleSchema } = require('./schemas/role.schema');
const { GoalSchema } = require('./schemas/goal.schema');
const { ScriptSchema } = require('./schemas/script.schema');

/**
 * ExperimentPlan Schema
 * Top-level template defining how an experiment should be conducted.
 * Composes Environment, Roles, Goals, and Scripts.
 */
const ExperimentPlanSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    initialEnvironment: {
        type: environmentSchema,
        default: () => ({ variables: {}, variableTypes: {} })
    },
    roles: [RoleSchema],
    goals: [GoalSchema],
    scripts: [ScriptSchema],
    maxSteps: {
        type: Number,
        required: true,
        default: 100,
        min: 1
    }
}, {
    timestamps: true
});

// Create the model
const ExperimentPlan = mongoose.model('ExperimentPlan', ExperimentPlanSchema);

module.exports = { ExperimentPlan };
