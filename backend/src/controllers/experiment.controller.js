const { Experiment } = require('../models/experiment.model');
const { ExperimentPlan } = require('../models/experimentPlan.model');
const { ExperimentOrchestrator } = require('../services/experiment-orchestrator.service');
const Log = require('../models/log.model');

// Valid experiment status values
const VALID_STATUSES = ['INITIALIZING', 'RUNNING', 'PAUSED', 'COMPLETED', 'FAILED', 'STOPPED'];
// Statuses that indicate an experiment can be deleted
const DELETABLE_STATUSES = ['COMPLETED', 'FAILED', 'STOPPED'];

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

/**
 * List all experiments with optional status filter
 * GET /api/experiments
 */
const listExperiments = async (req, res, next) => {
    try {
        const { status } = req.query;
        const query = {};

        // Validate and apply status filter if provided
        if (status) {
            if (!VALID_STATUSES.includes(status)) {
                return res.status(400).json({
                    error: true,
                    message: `Invalid status filter. Must be one of: ${VALID_STATUSES.join(', ')}`
                });
            }
            query.status = status;
        }

        const experiments = await Experiment.find(query)
            .select('planId status currentStep startTime endTime result')
            .sort({ startTime: -1 })
            .lean();

        res.status(200).json(experiments);
    } catch (error) {
        next(error);
    }
};

/**
 * Get a single experiment by ID
 * GET /api/experiments/:id
 */
const getExperiment = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Validate ObjectId format
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                error: true,
                message: 'Invalid ID format'
            });
        }

        const experiment = await Experiment.findById(id).lean();

        if (!experiment) {
            return res.status(404).json({
                error: true,
                message: 'Experiment not found'
            });
        }

        res.status(200).json(experiment);
    } catch (error) {
        next(error);
    }
};

/**
 * Delete an experiment by ID
 * DELETE /api/experiments/:id
 * 
 * Only allows deletion of ended experiments (COMPLETED, FAILED, STOPPED).
 * Also deletes associated logs.
 * 
 * TODO: Future - consider soft delete/archive instead of hard delete
 */
const deleteExperiment = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Validate ObjectId format
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                error: true,
                message: 'Invalid ID format'
            });
        }

        const experiment = await Experiment.findById(id);

        if (!experiment) {
            return res.status(404).json({
                error: true,
                message: 'Experiment not found'
            });
        }

        // Check if experiment can be deleted
        if (!DELETABLE_STATUSES.includes(experiment.status)) {
            return res.status(400).json({
                error: true,
                message: `Cannot delete experiment in state ${experiment.status}. Only ${DELETABLE_STATUSES.join(', ')} experiments can be deleted.`
            });
        }

        // Delete associated logs first
        await Log.deleteMany({ experimentId: id });

        // Delete the experiment
        await Experiment.findByIdAndDelete(id);

        res.status(204).send();
    } catch (error) {
        next(error);
    }
};

module.exports = {
    launchExperiment,
    controlExperiment,
    listExperiments,
    getExperiment,
    deleteExperiment
};
