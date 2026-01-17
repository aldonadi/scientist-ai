const { Provider } = require('../models/provider.model');

exports.listProviders = async (req, res, next) => {
    try {
        const providers = await Provider.find().select('name type').lean();
        res.json(providers);
    } catch (error) {
        next(error);
    }
};
