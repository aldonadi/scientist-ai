const mongoose = require('mongoose');
const { RoleSchema } = require('../../../src/models/schemas/role.schema');

// Check if model already exists to avoid recompilation error in watch mode
const Role = mongoose.models.RoleTest || mongoose.model('RoleTest', new mongoose.Schema({
    role: RoleSchema
}));

describe('Role Schema', () => {
    it('should validate a valid role', async () => {
        const validRole = {
            role: {
                name: 'Trader',
                modelConfig: {
                    provider: new mongoose.Types.ObjectId(),
                    modelName: 'gpt-4',
                    config: { temperature: 0.7 }
                },
                systemPrompt: 'You are a trader.',
                tools: [new mongoose.Types.ObjectId()],
                variableWhitelist: ['price', 'volume']
            }
        };

        const doc = new Role(validRole);
        await doc.validate();
        expect(doc.role.name).toBe('Trader');
        expect(doc.role.modelConfig.modelName).toBe('gpt-4');
    });

    it('should require a name', async () => {
        const invalidRole = {
            role: {
                modelConfig: {
                    provider: new mongoose.Types.ObjectId(),
                    modelName: 'gpt-4'
                }
            }
        };

        const doc = new Role(invalidRole);
        let err;
        try {
            await doc.validate();
        } catch (error) {
            err = error;
        }
        expect(err).toBeDefined();
        expect(err.errors['role.name']).toBeDefined();
    });

    it('should require modelConfig', async () => {
        const invalidRole = {
            role: {
                name: 'Trader',
                systemPrompt: 'test'
            }
        };

        const doc = new Role(invalidRole);
        let err;
        try {
            await doc.validate();
        } catch (error) {
            err = error;
        }
        expect(err).toBeDefined();
        expect(err.errors['role.modelConfig']).toBeDefined();
    });

    it('should allow empty tools and whitelist', async () => {
        const minimalRole = {
            role: {
                name: 'Minimalist',
                modelConfig: {
                    provider: new mongoose.Types.ObjectId(),
                    modelName: 'gpt-3.5'
                }
            }
        };

        const doc = new Role(minimalRole);
        await doc.validate();
        expect(doc.role.tools).toHaveLength(0);
        expect(doc.role.variableWhitelist).toHaveLength(0);
    });
});
