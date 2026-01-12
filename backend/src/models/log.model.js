const mongoose = require('mongoose');

const LogEntrySchema = new mongoose.Schema({
    experimentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Experiment',
        required: true,
        index: true
    },
    stepNumber: {
        type: Number,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now,
        required: true
    },
    source: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    data: {
        type: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: false, // We use our own timestamp field, but Mongoose's timestamps option adds createdAt/updatedAt.
    // SPEC calls for 'timestamp' field. I added it above. Maybe distinct from createdAt. 
    // Given logs are immutable, createdAt == timestamp usually.
    // But SPEC says "timestamp: Date". I will Stick to that.
});

// Compound Index as per SPEC
LogEntrySchema.index({ experimentId: 1, stepNumber: 1 });
LogEntrySchema.index({ timestamp: -1 }); // TTL optional per spec, but index suggested.

const Log = mongoose.model('Log', LogEntrySchema);

module.exports = Log;
