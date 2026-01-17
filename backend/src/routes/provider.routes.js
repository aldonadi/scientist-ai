const express = require('express');
const router = express.Router();
const providerController = require('../controllers/provider.controller');

router.get('/', providerController.listProviders);

module.exports = router;
