const { Provider } = require('../models/provider.model');
const ProviderService = require('../services/provider/provider.service');


exports.listProviders = async (req, res, next) => {
    try {
        const providers = await Provider.find().select('name type').lean();
        res.json(providers);
    } catch (error) {
        next(error);
    }
};

exports.getProviderModels = async (req, res, next) => {
    try {
        const { id } = req.params;
        const provider = await Provider.findById(id);

        if (!provider) {
            return res.status(404).json({
                error: true,
                message: 'Provider not found'
            });
        }

        const models = await ProviderService.listModels(provider);
        res.json(models);
    } catch (error) {
        next(error);
    }
};

