const mongoose = require('mongoose');

const toolSchema = new mongoose.Schema({
    namespace: {
        type: String,
        required: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true,
        validate: {
            validator: function (v) {
                // Enforce safe names for Python functions (alphanumeric + underscore)
                return /^[a-zA-Z0-9_]+$/.test(v);
            },
            message: props => `${props.value} isn't a valid tool name. Use only alphanumeric characters and underscores.`
        }
    },
    description: {
        type: String,
        default: ''
    },
    parameters: {
        type: mongoose.Schema.Types.Mixed,
        default: { type: 'object', properties: {} }
    },
    code: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Compound unique index to prevent duplicate names within a namespace
toolSchema.index({ namespace: 1, name: 1 }, { unique: true });

const Tool = mongoose.model('Tool', toolSchema);

module.exports = Tool;
