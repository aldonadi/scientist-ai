const express = require('express');
const router = express.Router();
const experimentController = require('../controllers/experiment.controller');

// GET /api/experiments - List all experiments
router.get('/', experimentController.listExperiments);

// GET /api/experiments/:id - Get a single experiment
router.get('/:id', experimentController.getExperiment);

// POST /api/experiments - Launch a new experiment
router.post('/', experimentController.launchExperiment);

// POST /api/experiments/:id/control - Control experiment (pause/resume/stop)
router.post('/:id/control', experimentController.controlExperiment);

// GET /api/experiments/:id/logs - Get logs for an experiment
router.get('/:id/logs', experimentController.getExperimentLogs);

// GET /api/experiments/:id/stream - Stream events
router.get('/:id/stream', experimentController.streamExperimentEvents);

// GET /api/experiments/:id/history - Get state history
router.get('/:id/history', experimentController.getExperimentHistory);

// DELETE /api/experiments/:id - Delete an ended experiment
router.delete('/:id', experimentController.deleteExperiment);

module.exports = router;
