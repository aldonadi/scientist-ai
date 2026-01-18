const mongoose = require('mongoose');
require('dotenv').config();
const { Provider, PROVIDER_TYPES } = require('./src/models/provider.model');

async function seed() {
    console.log('Connecting to Mongo using MONGO_URI...');
    // Use the variable name found in index.js: MONGO_URI
    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/scientist_ai';

    await mongoose.connect(uri);
    console.log('Connected.');

    // Check if exists
    let provider = await Provider.findOne({ type: PROVIDER_TYPES.OLLAMA });
    if (!provider) {
        provider = new Provider({
            name: 'Local Ollama',
            type: PROVIDER_TYPES.OLLAMA,
            baseUrl: 'http://localhost:11434',
        });
        await provider.save();
        console.log('CREATED_PROVIDER_ID:', provider._id.toString());
    } else {
        console.log('EXISTING_PROVIDER_ID:', provider._id.toString());
    }

    await mongoose.disconnect();
}

seed().catch((err) => {
    console.error('Seed Error:', err);
    process.exit(1);
});
