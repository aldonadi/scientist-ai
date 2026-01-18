const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { ExperimentPlan } = require('../../src/models/experimentPlan.model');

describe('ExperimentPlan Model Test', () => {
    jest.setTimeout(30000);
    let mongoServer;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        await mongoose.connect(mongoUri);
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    afterEach(async () => {
        await ExperimentPlan.deleteMany({});
    });

    it('should create & save a valid experiment plan', async () => {
        const validPlan = {
            name: 'Test Plan',
            description: 'A test experiment plan',
            initialEnvironment: {
                variables: { money: 100 },
                variableTypes: { money: 'int' }
            },
            roles: [{
                name: 'Trader',
                modelConfig: {
                    provider: new mongoose.Types.ObjectId(),
                    modelName: 'gpt-4',
                    config: { temperature: 0.7 }
                },
                systemPrompt: 'You are a trader.',
                variableWhitelist: ['money']
            }],
            goals: [{
                description: 'Make profit',
                conditionScript: 'return env.money > 1000'
            }],
            scripts: [{
                hookType: 'STEP_START',
                code: 'print("Step started")'
            }],
            maxSteps: 50
        };

        const savedPlan = await new ExperimentPlan(validPlan).save();

        expect(savedPlan._id).toBeDefined();
        expect(savedPlan.name).toBe(validPlan.name);
        expect(savedPlan.description).toBe(validPlan.description);
        expect(savedPlan.initialEnvironment.variables.money).toBe(100);
        expect(savedPlan.roles.length).toBe(1);
        expect(savedPlan.roles[0].name).toBe('Trader');
        expect(savedPlan.goals.length).toBe(1);
        expect(savedPlan.scripts.length).toBe(1);
        expect(savedPlan.maxSteps).toBe(50);
        expect(savedPlan.createdAt).toBeDefined();
        expect(savedPlan.updatedAt).toBeDefined();
    });

    it('should create a minimal plan with only required fields', async () => {
        const minimalPlan = {
            name: 'Minimal Plan'
        };

        const savedPlan = await new ExperimentPlan(minimalPlan).save();

        expect(savedPlan._id).toBeDefined();
        expect(savedPlan.name).toBe(minimalPlan.name);
        expect(savedPlan.maxSteps).toBe(100); // Default value
        expect(savedPlan.roles).toHaveLength(0);
        expect(savedPlan.goals).toHaveLength(0);
        expect(savedPlan.scripts).toHaveLength(0);
        expect(savedPlan.initialEnvironment).toBeDefined();
    });

    it('should fail validation without required name field', async () => {
        const invalidPlan = {
            description: 'Missing name'
        };

        let err;
        try {
            await new ExperimentPlan(invalidPlan).save();
        } catch (error) {
            err = error;
        }

        expect(err).toBeDefined();
        expect(err.name).toBe('ValidationError');
        expect(err.errors.name).toBeDefined();
    });

    it('should fail validation with duplicate name', async () => {
        const plan1 = { name: 'Duplicate Name' };
        await new ExperimentPlan(plan1).save();

        const plan2 = { name: 'Duplicate Name' };

        let err;
        try {
            await new ExperimentPlan(plan2).save();
        } catch (error) {
            err = error;
        }

        expect(err).toBeDefined();
        // Mongoose 6+ duplicate key error comes from MongoDB driver
        expect(err.code).toBe(11000);
    });

    it('should fail validation if nested schemas are invalid', async () => {
        const invalidNestedPlan = {
            name: 'Invalid Nested Plan',
            roles: [{
                // Missing modelConfig and name
                systemPrompt: 'Invalid Role'
            }]
        };

        let err;
        try {
            await new ExperimentPlan(invalidNestedPlan).save();
        } catch (error) {
            err = error;
        }

        expect(err).toBeDefined();
        expect(err.name).toBe('ValidationError');
        // Check for specific error in nested document
        // The error path usually includes index like 'roles.0.name'
        expect(Object.keys(err.errors).some(k => k.includes('roles'))).toBe(true);
    });
});
