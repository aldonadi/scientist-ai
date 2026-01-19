const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');

// Get all settings with values
router.get('/', settingsController.getAllSettings);

// Get definitions only (for UI)
router.get('/definitions', settingsController.getDefinitions);

// Export settings as JSON
router.post('/export', settingsController.exportSettings);

// Import settings from JSON
router.post('/import', settingsController.importSettings);

// Factory reset
router.post('/reset-all', settingsController.resetAllSettings);

// Single setting operations - key can contain dots (e.g., providers.ollama.apiBaseUrl)
// These must come after static routes
router.get('/:key', settingsController.getSetting);
router.put('/:key', settingsController.updateSetting);
router.delete('/:key', settingsController.resetSetting);

module.exports = router;
