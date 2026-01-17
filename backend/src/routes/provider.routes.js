const express = require('express');
const router = express.Router();
const providerController = require('../controllers/provider.controller');

router.get('/', providerController.listProviders);
router.get('/:id/models', providerController.getProviderModels);


module.exports = router;
