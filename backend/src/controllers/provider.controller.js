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
exports.testProviderModel = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { model, message } = req.body;
        const provider = await Provider.findById(id);

        if (!provider) {
            return res.status(404).json({
                error: true,
                message: 'Provider not found'
            });
        }

        const history = [{ role: 'user', content: message || 'Hello' }];
        const stream = await ProviderService.chat(provider, model, history, [], { max_tokens: 50 });

        let result = '';
        for await (const chunk of stream) {
            if (chunk.type === 'text') {
                result += chunk.content;
            }
        }

        res.json({ success: true, message: result });
    } catch (error) {
        next(error);
    }
};

