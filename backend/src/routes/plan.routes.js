const express = require('express');
const router = express.Router();
const planController = require('../controllers/plan.controller');

// POST /api/plans - Create a new experiment plan
router.post('/', planController.createPlan);

// GET /api/plans - List all experiment plans
router.get('/', planController.listPlans);

module.exports = router;
