const express = require('express');
const router = express.Router();
const planController = require('../controllers/plan.controller');

// POST /api/plans - Create a new experiment plan
router.post('/', planController.createPlan);

// GET /api/plans - List all experiment plans
router.get('/', planController.listPlans);

// GET /api/plans/:id - Get a single experiment plan
router.get('/:id', planController.getPlan);

// PUT /api/plans/:id - Update an experiment plan
router.put('/:id', planController.updatePlan);

module.exports = router;
