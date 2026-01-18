const mongoose = require('mongoose');
const { ScriptSchema } = require('../../../src/models/schemas/script.schema');

// Test Model
const Script = mongoose.models.ScriptTest || mongoose.model('ScriptTest', new mongoose.Schema({
    script: ScriptSchema
}));

describe('Script Schema', () => {
    it('should validate a valid script', async () => {
        const validScript = {
            script: {
                hookType: 'STEP_START',
                code: 'print("Step started")'
            }
        };

        const doc = new Script(validScript);
        await doc.validate();
        expect(doc.script.hookType).toBe('STEP_START');
    });

    it('should fail on invalid hookType', async () => {
        const invalidScript = {
            script: {
                hookType: 'INVALID_HOOK',
                code: 'pass'
            }
        };

        const doc = new Script(invalidScript);
        let err;
        try {
            await doc.validate();
        } catch (error) {
            err = error;
        }
        expect(err).toBeDefined();
        expect(err.errors['script.hookType']).toBeDefined();
    });

    it('should require code', async () => {
        const invalidScript = {
            script: {
                hookType: 'EXPERIMENT_END'
            }
        };

        const doc = new Script(invalidScript);
        let err;
        try {
            await doc.validate();
        } catch (error) {
            err = error;
        }
        expect(err).toBeDefined();
        expect(err.errors['script.code']).toBeDefined();
    });
});
