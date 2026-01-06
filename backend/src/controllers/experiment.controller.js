const { Experiment } = require('../models/experiment.model');
const { ExperimentPlan } = require('../models/experimentPlan.model');

/**
 * Launch a new experiment from a plan
 * POST /api/experiments
 */
const launchExperiment = async (req, res, next) => {
    try {
        const { planId } = req.body;

        if (!planId) {
            return res.status(400).json({
                error: true,
                message: 'planId is required'
            });
        }

        const plan = await ExperimentPlan.findById(planId);
        if (!plan) {
            return res.status(404).json({
                error: true,
                message: 'Experiment Plan not found'
            });
        }

        const experiment = new Experiment({
            planId: plan._id,
            status: 'INITIALIZING',
            currentEnvironment: plan.initialEnvironment,
            startTime: new Date()
        });

        await experiment.save();

        res.status(201).json(experiment);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    launchExperiment
};
