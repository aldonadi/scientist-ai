const express = require('express');
const router = express.Router();
const toolController = require('../controllers/tool.controller');

router.post('/', toolController.createTool);

module.exports = router;
