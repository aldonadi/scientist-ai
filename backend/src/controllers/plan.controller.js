const { ExperimentPlan } = require('../models/experimentPlan.model');
const { Provider } = require('../models/provider.model');
const Tool = require('../models/tool.model');


/**
 * Validates that all referenced IDs exist in the database.
 * @param {Object} planData raw request body
 * @returns {Promise<Array<String>>} List of error messages, empty if valid
 */
async function validateReferences(planData) {
    const errors = [];

    if (!planData.roles || !Array.isArray(planData.roles)) {
        return errors; // Basic structure validation happens via Mongoose
    }

    // deeply verify provider and tool IDs
    for (let i = 0; i < planData.roles.length; i++) {
        const role = planData.roles[i];

        // 1. Validate Provider
        if (role.modelConfig && role.modelConfig.provider) {
            const providerExists = await Provider.findById(role.modelConfig.provider);
            if (!providerExists) {
                errors.push(`Role[${i}] '${role.name}': Provider ID '${role.modelConfig.provider}' not found.`);
            }
        }

        // 2. Validate Tools
        if (role.tools && Array.isArray(role.tools)) {
            for (const toolId of role.tools) {
                const toolExists = await Tool.findById(toolId);
                if (!toolExists) {
                    errors.push(`Role[${i}] '${role.name}': Tool ID '${toolId}' not found.`);
                }
            }
        }
    }

    return errors;
}

exports.createPlan = async (req, res, next) => {
    try {
        // 1. Validate References (Provider, Tools)
        const referenceErrors = await validateReferences(req.body);
        if (referenceErrors.length > 0) {
            return res.status(400).json({
                error: 'Validation Error',
                messages: referenceErrors
            });
        }

        // 2. Create Plan
        const plan = new ExperimentPlan(req.body);
        await plan.save();

        res.status(201).json(plan);
    } catch (error) {
        if (error.code === 11000) {
            // Duplicate key error (name)
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Plan name must be unique.'
            });
        }
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({
                error: 'Validation Error',
                messages: messages
            });
        }

        next(error);
    }
};

/**
 * List all plans with summary details.
 * GET /api/plans
 */
exports.listPlans = async (req, res, next) => {
    try {
        const plans = await ExperimentPlan.find()
            .select('name description roles goals createdAt updatedAt')
            .lean();

        // Transform results to add counts
        const summary = plans.map(plan => ({
            _id: plan._id,
            name: plan.name,
            description: plan.description,
            roleCount: plan.roles ? plan.roles.length : 0,
            goalCount: plan.goals ? plan.goals.length : 0,
            createdAt: plan.createdAt,
            updatedAt: plan.updatedAt
        }));

        res.status(200).json(summary);
    } catch (error) {
        next(error);
    }
};
