const mongoose = require('mongoose');
const { ModelConfigSchema } = require('../../../src/models/schemas/modelConfig.schema');

// Prepare a dummy model to test the embedded schema
const TestRole = mongoose.model('TestRole', new mongoose.Schema({
    modelConfig: {
        type: ModelConfigSchema,
        required: true
    }
}));

describe('ModelConfig Schema', () => {
    it('should validate a valid model config', () => {
        const validConfig = new TestRole({
            modelConfig: {
                provider: new mongoose.Types.ObjectId(),
                modelName: 'gpt-4',
                config: { temperature: 0.7 }
            }
        });

        const err = validConfig.validateSync();
        expect(err).toBeUndefined();
    });

    it('should require provider', () => {
        const invalidConfig = new TestRole({
            modelConfig: {
                modelName: 'gpt-4'
            }
        });

        const err = invalidConfig.validateSync();
        expect(err.errors['modelConfig.provider']).toBeDefined();
    });

    it('should require modelName', () => {
        const invalidConfig = new TestRole({
            modelConfig: {
                provider: new mongoose.Types.ObjectId()
            }
        });

        const err = invalidConfig.validateSync();
        expect(err.errors['modelConfig.modelName']).toBeDefined();
    });

    it('should allow flexible config object', () => {
        const complexConfig = new TestRole({
            modelConfig: {
                provider: new mongoose.Types.ObjectId(),
                modelName: 'llama3',
                config: {
                    temp: 0.1,
                    stop: ['\n'],
                    nested: { key: 'value' }
                }
            }
        });

        const err = complexConfig.validateSync();
        expect(err).toBeUndefined();
        expect(complexConfig.modelConfig.config.temp).toBe(0.1);
    });

    it('isValid method should return true when required fields are present', () => {
        const doc = new TestRole({
            modelConfig: {
                provider: new mongoose.Types.ObjectId(),
                modelName: 'claude-3'
            }
        });
        expect(doc.modelConfig.isValid()).toBe(true);
    });
});
