const { z } = require('zod');
const { getSettingsService } = require('../services/settings');

/**
 * Get all settings with current values and definitions.
 * GET /api/settings
 */
const getAllSettings = async (req, res, next) => {
    try {
        const settings = getSettingsService();
        const allSettings = await settings.getAll();
        res.status(200).json(allSettings);
    } catch (error) {
        next(error);
    }
};

/**
 * Get all setting definitions (for UI rendering).
 * GET /api/settings/definitions
 */
const getDefinitions = async (req, res, next) => {
    try {
        const settings = getSettingsService();
        const definitions = settings.getDefinitions();
        res.status(200).json(definitions);
    } catch (error) {
        next(error);
    }
};

/**
 * Get a single setting value.
 * GET /api/settings/:key
 */
const getSetting = async (req, res, next) => {
    try {
        const { key } = req.params;
        const settings = getSettingsService();

        const definition = settings.getDefinition(key);
        if (!definition) {
            return res.status(404).json({
                error: 'Not Found',
                message: `Setting not found: ${key}`,
            });
        }

        const value = await settings.get(key);
        res.status(200).json({
            key,
            value,
            ...definition,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update a setting value.
 * PUT /api/settings/:key
 */
const updateSetting = async (req, res, next) => {
    try {
        const { key } = req.params;
        const { value } = req.body;

        if (value === undefined) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Value is required',
            });
        }

        const settings = getSettingsService();
        const result = await settings.set(key, value);

        if (!result.success) {
            return res.status(400).json({
                error: 'Validation Error',
                details: result.errors,
            });
        }

        // Return the updated setting
        const newValue = await settings.get(key);
        res.status(200).json({
            key,
            value: newValue,
            message: 'Setting updated successfully',
        });
    } catch (error) {
        if (error.message.includes('Unknown setting')) {
            return res.status(404).json({
                error: 'Not Found',
                message: error.message,
            });
        }
        next(error);
    }
};

/**
 * Reset a setting to its default value.
 * DELETE /api/settings/:key
 */
const resetSetting = async (req, res, next) => {
    try {
        const { key } = req.params;
        const settings = getSettingsService();

        const wasStored = await settings.reset(key);
        const defaultValue = await settings.get(key);

        res.status(200).json({
            key,
            value: defaultValue,
            wasReset: wasStored,
            message: wasStored ? 'Setting reset to default' : 'Setting was already at default',
        });
    } catch (error) {
        if (error.message.includes('Unknown setting')) {
            return res.status(404).json({
                error: 'Not Found',
                message: error.message,
            });
        }
        next(error);
    }
};

/**
 * Export all settings as JSON.
 * POST /api/settings/export
 */
const exportSettings = async (req, res, next) => {
    try {
        const settings = getSettingsService();
        const exportData = await settings.exportSettings();
        res.status(200).json(exportData);
    } catch (error) {
        next(error);
    }
};

/**
 * Import settings from JSON.
 * POST /api/settings/import
 */
const importSettings = async (req, res, next) => {
    try {
        const settings = getSettingsService();
        const result = await settings.importSettings(req.body);

        const status = result.errors.length > 0 ? 207 : 200; // 207 Multi-Status if partial
        res.status(status).json(result);
    } catch (error) {
        next(error);
    }
};

/**
 * Reset all settings to defaults (factory reset).
 * POST /api/settings/reset-all
 */
const resetAllSettings = async (req, res, next) => {
    try {
        const settings = getSettingsService();
        const count = await settings.resetAll();

        res.status(200).json({
            message: 'All settings reset to defaults',
            settingsReset: count,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllSettings,
    getDefinitions,
    getSetting,
    updateSetting,
    resetSetting,
    exportSettings,
    importSettings,
    resetAllSettings,
};
