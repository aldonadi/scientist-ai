const express = require('express');
const router = express.Router();
const experimentController = require('../controllers/experiment.controller');

// POST /api/experiments - Launch a new experiment
router.post('/', experimentController.launchExperiment);
router.post('/:id/control', experimentController.controlExperiment);

module.exports = router;
