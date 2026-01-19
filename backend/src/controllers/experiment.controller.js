const { Experiment } = require('../models/experiment.model');
const { ExperimentPlan } = require('../models/experimentPlan.model');
const { ExperimentOrchestrator } = require('../services/experiment-orchestrator.service');
const { ExperimentStateHistory } = require('../models/history.model');
const OrchestratorRegistry = require('../services/orchestrator-registry.service');
const { EventTypes } = require('../services/event-bus');
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

        // Register in registry before starting
        OrchestratorRegistry.getInstance().register(experiment._id, orchestrator);

        orchestrator.start()
            .then(() => {
                // Determine if we should remove from registry? 
                // Currently start() runs until completion.
                // So when it returns, it's done.
            })
            .catch(err => {
                console.error(`Orchestrator start failed for ${experiment._id}:`, err);
            })
            .finally(() => {
                // Cleanup registry when loop finishes
                OrchestratorRegistry.getInstance().remove(experiment._id);
            });

        res.status(201).json(experiment);
    } catch (error) {
        next(error);
    }
};

const controlExperiment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const rawCommand = req.body.command;
        const command = rawCommand ? rawCommand.toUpperCase() : null;

        console.log(`[ExperimentControl] Received command: ${command} for experiment: ${id}`);

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
                // Check if an orchestrator is already running/resident
                const existingOrchestrator = OrchestratorRegistry.getInstance().get(experiment._id);

                if (existingOrchestrator) {
                    // Already exists. Updating the status in DB (below) will trigger it to continue its loop.
                    console.log(`[Resume] Orchestrator already exists for ${experiment._id}. Resuming existing instance.`);
                } else {
                    // Use start() to spin up a new one
                    const orchestrator = new ExperimentOrchestrator(experiment._id);

                    // Register for streaming visibility
                    OrchestratorRegistry.getInstance().register(experiment._id, orchestrator);

                    orchestrator.start()
                        .catch(err => {
                            console.error(`Orchestrator resume failed for ${experiment._id}:`, err);
                        })
                        .finally(() => {
                            OrchestratorRegistry.getInstance().remove(experiment._id);
                        });
                }

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

        res.json(experiment);

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

// Pagination defaults
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 500;

/**
 * Get logs for a specific experiment
 * GET /api/experiments/:id/logs
 * 
 * Query params:
 * - step: Filter by step number
 * - source: Filter by source string
 * - limit: Max results to return (default 50, max 500)
 * - offset: Number of results to skip (default 0)
 */
const getExperimentLogs = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { step, source, limit, offset } = req.query;

        // Validate ObjectId format
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                error: true,
                message: 'Invalid ID format'
            });
        }

        // Check experiment exists
        const experiment = await Experiment.findById(id).lean();
        if (!experiment) {
            return res.status(404).json({
                error: true,
                message: 'Experiment not found'
            });
        }

        // Build query
        const query = { experimentId: id };

        // Step filter
        if (step !== undefined) {
            const stepNum = parseInt(step, 10);
            if (isNaN(stepNum)) {
                return res.status(400).json({
                    error: true,
                    message: 'Invalid step parameter, must be a number'
                });
            }
            query.stepNumber = stepNum;
        }

        // Source filter (accept any string)
        if (source) {
            query.source = source;
        }

        // Pagination
        let limitNum = parseInt(limit, 10) || DEFAULT_LIMIT;
        limitNum = Math.min(Math.max(1, limitNum), MAX_LIMIT);

        let offsetNum = parseInt(offset, 10) || 0;
        offsetNum = Math.max(0, offsetNum);

        // Query logs
        const logs = await Log.find(query)
            .sort({ timestamp: 1 }) // Chronological order (oldest first)
            .skip(offsetNum)
            .limit(limitNum)
            .lean();

        // Get total count for pagination metadata
        const totalCount = await Log.countDocuments(query);

        res.status(200).json({
            logs,
            pagination: {
                total: totalCount,
                limit: limitNum,
                offset: offsetNum,
                hasMore: offsetNum + logs.length < totalCount
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * SSE Stream for experiment events
 * GET /api/experiments/:id/stream
 */
const streamExperimentEvents = async (req, res) => {
    const { id } = req.params;

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
            error: true,
            message: 'Invalid ID format'
        });
    }

    // Set SSE Headers
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*' // Adjust for prod
    });

    const sendEvent = (type, data) => {
        // SSE format: event: name\ndata: {json}\n\n
        res.write(`event: ${type}\n`);
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    // Send initial connection message
    sendEvent('CONNECTED', { message: 'Stream connected', experimentId: id });

    // Look for active orchestrator
    const orchestrator = OrchestratorRegistry.getInstance().get(id);

    if (orchestrator) {
        // Subscribe to relevant events
        // We can listen to ALL defined EventTypes or specific ones.
        // Let's iterate all EventTypes and pipe them.

        const handlers = {};

        Object.values(EventTypes).forEach(eventType => {
            const handler = (payload) => {
                sendEvent(eventType, payload);
            };
            handlers[eventType] = handler;
            orchestrator.eventBus.on(eventType, handler);
        });

        // Cleanup on disconnect
        req.on('close', () => {
            Object.entries(handlers).forEach(([eventType, handler]) => {
                orchestrator.eventBus.removeListener(eventType, handler);
            });
        });

    } else {
        // Experiment is not running. 
        // We might want to check DB status.
        // If COMPLETED/FAILED, send END event and close.
        // If PAUSED/STOPPED, explain provided stream works for active execution.

        try {
            const exp = await Experiment.findById(id);
            if (exp) {
                if (['COMPLETED', 'FAILED', 'STOPPED'].includes(exp.status)) {
                    sendEvent(EventTypes.EXPERIMENT_END, {
                        result: exp.result,
                        status: exp.status
                    });
                    res.end();
                } else {
                    // It might be Initializing or Paused but no orchestrator in memory?
                    // Send status and keep open in case it resumes? 
                    // Or close. Simpler to close for now or just wait.
                    sendEvent('STATUS', { status: exp.status, message: 'Orchestrator not active in memory' });
                }
            } else {
                sendEvent('ERROR', { message: 'Experiment not found' });
                res.end();
            }
        } catch (err) {
            console.error('Error fetching stream experiment:', err);
            res.end();
        }
    }
};

/**
 * Get state history for a specific experiment
 * GET /api/experiments/:id/history
 */
const getExperimentHistory = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Validate ObjectId format
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                error: true,
                message: 'Invalid ID format'
            });
        }

        const history = await ExperimentStateHistory.find({ experimentId: id })
            .sort({ stepNumber: 1 }) // Chronological order
            .lean();

        res.status(200).json(history);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    launchExperiment,
    controlExperiment,
    listExperiments,
    getExperiment,
    deleteExperiment,
    getExperimentLogs,
    streamExperimentEvents,
    getExperimentHistory
};
