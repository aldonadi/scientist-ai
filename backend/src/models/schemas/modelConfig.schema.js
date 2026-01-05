const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * ModelConfig Schema
 * Subdocument schema for Role objects.
 * Specifies which provider and model to use, along with configuration.
 */
const ModelConfigSchema = new Schema({
    provider: {
        type: Schema.Types.ObjectId,
        ref: 'Provider',
        required: true
    },
    modelName: {
        type: String,
        required: true,
        trim: true
    },
    config: {
        type: Schema.Types.Mixed,
        default: {}
    }
}, {
    _id: false, // Subdocuments used as config don't necessarily need their own ID, but Mongoose adds them by default. Spec didn't explicitly forbid it, but purely configuration objects often don't need it. However, keeping it false is cleaner for embedded config.
    timestamps: false
});

/**
 * Validates basic structure.
 * Real validation of provider existence is checking the db, which is service layer logic.
 */
ModelConfigSchema.methods.isValid = function () {
    return !!(this.provider && this.modelName);
};

module.exports = { ModelConfigSchema };
