const { Experiment } = require('../models/experiment.model');
const { ExperimentPlan } = require('../models/experimentPlan.model');
const { ExperimentOrchestrator } = require('../services/experiment-orchestrator.service');

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

        // Start Orchestrator Asynchronously
        const orchestrator = new ExperimentOrchestrator(experiment._id);
        orchestrator.start().catch(err => {
            console.error(`Orchestrator start failed for ${experiment._id}:`, err);
        });

        res.status(201).json(experiment);
    } catch (error) {
        next(error);
    }
};

const controlExperiment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { command } = req.body;

        if (!['PAUSE', 'RESUME', 'STOP'].includes(command)) {
            return res.status(400).json({
                error: true,
                message: 'Invalid command. Must be PAUSE, RESUME, or STOP.'
            });
        }

        const experiment = await Experiment.findById(id);
        if (!experiment) {
            return res.status(404).json({
                error: true,
                message: 'Experiment not found'
            });
        }

        const oldStatus = experiment.status;
        let newStatus = oldStatus;

        if (command === 'PAUSE') {
            if (experiment.status === 'RUNNING') {
                experiment.status = 'PAUSED';
                newStatus = 'PAUSED';
                await experiment.save();
            } else if (experiment.status !== 'PAUSED') {
                return res.status(400).json({
                    error: true,
                    message: `Cannot PAUSE experiment in state ${experiment.status}`,
                    oldStatus
                });
            }
        } else if (command === 'RESUME') {
            if (experiment.status === 'PAUSED') {
                const orchestrator = new ExperimentOrchestrator(experiment._id);
                orchestrator.start().catch(err => {
                    console.error(`Orchestartor resume failed for ${experiment._id}:`, err);
                });

                experiment.status = 'RUNNING';
                await experiment.save();
                newStatus = 'RUNNING';
            } else if (experiment.status !== 'RUNNING') {
                return res.status(400).json({
                    error: true,
                    message: `Cannot RESUME experiment in state ${experiment.status}`,
                    oldStatus
                });
            }
        } else if (command === 'STOP') {
            if (['RUNNING', 'PAUSED'].includes(experiment.status)) {
                experiment.status = 'STOPPED';
                experiment.endTime = new Date();
                experiment.result = 'Stopped by User';
                await experiment.save();
                newStatus = 'STOPPED';
            } else if (experiment.status !== 'STOPPED' && experiment.status !== 'COMPLETED' && experiment.status !== 'FAILED') {
                experiment.status = 'STOPPED';
                experiment.endTime = new Date();
                experiment.result = 'Stopped by User';
                await experiment.save();
                newStatus = 'STOPPED';
            } else {
                return res.status(400).json({
                    error: true,
                    message: `Cannot STOP experiment in state ${experiment.status}`,
                    oldStatus
                });
            }
        }

        res.json({
            success: true,
            oldStatus,
            newStatus,
            experimentId: experiment._id
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    launchExperiment,
    controlExperiment
};
