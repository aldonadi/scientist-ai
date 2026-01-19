const mongoose = require('mongoose');
const ISettingsStore = require('./settings-store.interface');

/**
 * Internal Mongoose schema for settings storage.
 * NOT exported - only for internal use by MongoDBSettingsStore.
 */
const settingSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        trim: true,
        index: true,
    },
    value: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
    },
    userId: {
        type: String,
        default: null,
        index: true,
    },
}, {
    timestamps: true,
    collection: 'settings',
});

// Compound unique index: key + userId
settingSchema.index({ key: 1, userId: 1 }, { unique: true });

// Only create the model if it doesn't already exist (prevents OverwriteModelError in tests)
const Setting = mongoose.models.Setting || mongoose.model('Setting', settingSchema);

/**
 * MongoDB-backed Settings Store
 * 
 * Stores settings in a MongoDB 'settings' collection.
 * Supports optional user scoping for future multi-user support.
 * 
 * @implements {ISettingsStore}
 */
class MongoDBSettingsStore extends ISettingsStore {
    /**
     * @inheritdoc
     */
    async get(key, scope = {}) {
        if (!key || typeof key !== 'string') {
            return null;
        }

        const query = { key, userId: scope.userId || null };
        const setting = await Setting.findOne(query);
        return setting ? setting.value : null;
    }

    /**
     * @inheritdoc
     */
    async set(key, value, scope = {}) {
        if (!key || typeof key !== 'string') {
            throw new Error('Key must be a non-empty string');
        }
        if (value === undefined) {
            throw new Error('Value cannot be undefined');
        }

        const query = { key, userId: scope.userId || null };
        await Setting.findOneAndUpdate(
            query,
            { key, value, userId: scope.userId || null },
            { upsert: true, new: true }
        );
    }

    /**
     * @inheritdoc
     */
    async delete(key, scope = {}) {
        if (!key || typeof key !== 'string') {
            return false;
        }

        const query = { key, userId: scope.userId || null };
        const result = await Setting.deleteOne(query);
        return result.deletedCount > 0;
    }

    /**
     * @inheritdoc
     */
    async getAll(scope = {}) {
        const query = { userId: scope.userId || null };
        const settings = await Setting.find(query);

        const result = {};
        for (const setting of settings) {
            result[setting.key] = setting.value;
        }
        return result;
    }

    /**
     * @inheritdoc
     */
    async deleteAll(scope = {}) {
        const query = { userId: scope.userId || null };
        const result = await Setting.deleteMany(query);
        return result.deletedCount;
    }
}

module.exports = MongoDBSettingsStore;
