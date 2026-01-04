const express = require('express');
const router = express.Router();
const toolController = require('../controllers/tool.controller');


router.post('/', toolController.createTool);
router.get('/', toolController.listTools);
router.get('/:id', toolController.getTool);
router.put('/:id', toolController.updateTool);
router.delete('/:id', toolController.deleteTool);


module.exports = router;
