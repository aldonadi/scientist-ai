const mongoose = require('mongoose');
const Log = require('../../src/models/log.model');

describe('Log Model Schema Test', () => {

    it('should be valid with all required fields', () => {
        const log = new Log({
            experimentId: new mongoose.Types.ObjectId(),
            stepNumber: 1,
            source: 'System',
            message: 'Experiment started',
            data: { key: 'value' }
        });
        const err = log.validateSync();
        expect(err).toBeUndefined();
    });

    it('should be invalid if required fields are missing', () => {
        const log = new Log({});
        const err = log.validateSync();
        expect(err.errors.experimentId).toBeDefined();
        expect(err.errors.stepNumber).toBeDefined();
        expect(err.errors.source).toBeDefined();
        expect(err.errors.message).toBeDefined();
    });

    it('should have a default timestamp', () => {
        const log = new Log({
            experimentId: new mongoose.Types.ObjectId(),
            stepNumber: 1,
            source: 'System',
            message: 'Test'
        });
        expect(log.timestamp).toBeDefined();
        expect(log.timestamp).toBeInstanceOf(Date);
    });

    it('should allow Mixed type for data', () => {
        const log1 = new Log({
            experimentId: new mongoose.Types.ObjectId(),
            stepNumber: 1,
            source: 'System',
            message: 'Test',
            data: { string: "val", number: 123 }
        });
        expect(log1.validateSync()).toBeUndefined();

        const log2 = new Log({
            experimentId: new mongoose.Types.ObjectId(),
            stepNumber: 1,
            source: 'System',
            message: 'Test',
            data: "Just a string"
        });
        expect(log2.validateSync()).toBeUndefined();
    });

    it('should define the compound index on experimentId and stepNumber', () => {
        const indexes = Log.schema.indexes();
        const foundIndex = indexes.find(index => {
            const keys = index[0];
            return keys.experimentId === 1 && keys.stepNumber === 1;
        });
        expect(foundIndex).toBeDefined();
    });

    it('should define the index on timestamp', () => {
        const indexes = Log.schema.indexes();
        const foundIndex = indexes.find(index => {
            const keys = index[0];
            return keys.timestamp === -1;
        });
        expect(foundIndex).toBeDefined();
    });
});
