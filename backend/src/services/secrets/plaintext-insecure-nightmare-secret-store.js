const mongoose = require('mongoose');
const ISecretStore = require('./secret-store.interface');

/**
 * Internal Mongoose schema for plaintext secret storage.
 * NOT exported - only for internal use by PlaintextInsecureNightmareSecretStore.
 */
const secretSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    value: {
        type: String,
        required: true
    }
}, {
    timestamps: true,
    collection: 'secrets'
});

// Only create the model if it doesn't already exist (prevents OverwriteModelError in tests)
const Secret = mongoose.models.Secret || mongoose.model('Secret', secretSchema);

/**
 * ⚠️ DEVELOPMENT-ONLY SECRET STORE ⚠️
 *
 * This implementation stores secrets in PLAINTEXT in MongoDB.
 * It exists solely for development convenience.
 *
 * DO NOT USE IN PRODUCTION. You have been warned. The name says it all.
 *
 * @implements {ISecretStore}
 */
class PlaintextInsecureNightmareSecretStore extends ISecretStore {
    constructor() {
        super();
        console.warn('\n' +
            '╔══════════════════════════════════════════════════════════════════╗\n' +
            '║  ⚠️  WARNING: PlaintextInsecureNightmareSecretStore in use! ⚠️   ║\n' +
            '║                                                                  ║\n' +
            '║  Secrets are stored in PLAINTEXT. This is a NIGHTMARE for        ║\n' +
            '║  security and should NEVER be used in production.                ║\n' +
            '║                                                                  ║\n' +
            '║  Replace with a secure implementation before deploying!          ║\n' +
            '╚══════════════════════════════════════════════════════════════════╝\n'
        );
    }

    /**
     * @inheritdoc
     */
    async store(key, value) {
        if (!key || typeof key !== 'string') {
            throw new Error('Key must be a non-empty string');
        }
        if (value === undefined || value === null) {
            throw new Error('Value cannot be null or undefined');
        }

        await Secret.findOneAndUpdate(
            { key },
            { key, value: String(value) },
            { upsert: true, new: true }
        );

        return key;
    }

    /**
     * @inheritdoc
     */
    async retrieve(key) {
        if (!key || typeof key !== 'string') {
            return null;
        }

        const secret = await Secret.findOne({ key });
        return secret ? secret.value : null;
    }

    /**
     * @inheritdoc
     */
    async delete(key) {
        if (!key || typeof key !== 'string') {
            return false;
        }

        const result = await Secret.deleteOne({ key });
        return result.deletedCount > 0;
    }

    /**
     * @inheritdoc
     */
    async exists(key) {
        if (!key || typeof key !== 'string') {
            return false;
        }

        const count = await Secret.countDocuments({ key });
        return count > 0;
    }
}

module.exports = PlaintextInsecureNightmareSecretStore;
