const { ExperimentPlan } = require('../models/experimentPlan.model');
const { Provider } = require('../models/provider.model');
const { Experiment } = require('../models/experiment.model');
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
            roles: plan.roles ? plan.roles.map(r => ({ name: r.name })) : [],
            createdAt: plan.createdAt,
            updatedAt: plan.updatedAt
        }));

        res.status(200).json(summary);
    } catch (error) {
        next(error);
    }
};

/**
 * Get a single plan by ID.
 * GET /api/plans/:id
 */
exports.getPlan = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Basic ID validation is handled by mongoose usually, but explicit check is good
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ error: 'Invalid ID format' });
        }

        const plan = await ExperimentPlan.findById(id)
            .populate('roles.tools') // Populate tool details
            .lean();

        if (!plan) {
            return res.status(404).json({ error: 'Plan not found' });
        }

        res.status(200).json(plan);
    } catch (error) {
        next(error);
    }
};

/**
 * Update a plan by ID.
 * PUT /api/plans/:id
 */
exports.updatePlan = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ error: 'Invalid ID format' });
        }

        // 1. Validate References (Provider, Tools)
        const referenceErrors = await validateReferences(req.body);
        if (referenceErrors.length > 0) {
            return res.status(400).json({
                error: 'Validation Error',
                messages: referenceErrors
            });
        }

        // 2. Update Plan
        const updatedPlan = await ExperimentPlan.findByIdAndUpdate(
            id,
            req.body,
            { new: true, runValidators: true, context: 'query' }
        );

        if (!updatedPlan) {
            return res.status(404).json({ error: 'Plan not found' });
        }

        res.status(200).json(updatedPlan);
    } catch (error) {
        if (error.code === 11000) {
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
 * Delete a plan by ID.
 * DELETE /api/plans/:id
 */
exports.deletePlan = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Basic ID validation
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ error: 'Invalid ID format' });
        }

        // 1. Check Referential Integrity (Experiment)
        const activeExperimentsCount = await Experiment.countDocuments({ planId: id });
        if (activeExperimentsCount > 0) {
            return res.status(409).json({
                error: 'Conflict',
                message: `Cannot delete plan. It is being used by ${activeExperimentsCount} experiment(s).`
            });
        }

        // 2. Delete Plan
        const deletedPlan = await ExperimentPlan.findByIdAndDelete(id);

        if (!deletedPlan) {
            return res.status(404).json({ error: 'Plan not found' });
        }

        res.status(200).json({
            message: 'Plan deleted successfully',
            id: deletedPlan._id
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Duplicate a plan by ID.
 * POST /api/plans/:id/duplicate
 * Body: { name: "New Name" } (Optional)
 */
exports.duplicatePlan = async (req, res, next) => {
    try {
        const { id } = req.params;
        const customName = req.body ? req.body.name : undefined;

        // console.log(`[DEBUG] Duplicating Plan ID: ${id}`);

        // Basic ID validation
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ error: 'Invalid ID format' });
        }

        // 1. Find Source Plan
        const sourcePlan = await ExperimentPlan.findById(id).lean();
        if (!sourcePlan) {
            return res.status(404).json({ error: 'Plan not found' });
        }

        // 2. Prepare New Name
        let newName = customName;
        if (!newName) {
            // Logic to find a unique name: "Original (Copy)", "Original (Copy 2)", etc.
            const baseName = `${sourcePlan.name} (Copy)`;
            newName = baseName;

            let counter = 2;
            while (await ExperimentPlan.exists({ name: newName })) {
                if (counter > 10) {
                    return res.status(409).json({
                        error: 'Conflict',
                        message: 'Too many copies exist. Please provide a unique name manually.'
                    });
                }
                newName = `${sourcePlan.name} (Copy ${counter})`;
                counter++;
            }
        } else {
            // Check if custom name exists (though save() will also check unique index)
            const exists = await ExperimentPlan.exists({ name: newName });
            if (exists) {
                return res.status(400).json({
                    error: 'Validation Error',
                    message: 'Plan name must be unique.'
                });
            }
        }

        // 3. Create New Plan Object
        // Remove _id, createdAt, updatedAt, __v
        const { _id, createdAt, updatedAt, __v, ...planData } = sourcePlan;

        const newPlanData = {
            ...planData,
            name: newName,
            roles: planData.roles ? planData.roles.map(role => {
                const { _id, ...roleData } = role; // Remove subdocument IDs to let Mongoose generate new ones
                return roleData;
            }) : [],
            goals: planData.goals ? planData.goals.map(goal => {
                const { _id, ...goalData } = goal;
                return goalData;
            }) : [],
            scripts: planData.scripts ? planData.scripts.map(script => {
                const { _id, ...scriptData } = script;
                return scriptData;
            }) : []
        };

        // 4. Save
        const newPlan = new ExperimentPlan(newPlanData);
        await newPlan.save();

        res.status(201).json(newPlan);

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Plan name must be unique.'
            });
        }
        next(error);
    }
};
