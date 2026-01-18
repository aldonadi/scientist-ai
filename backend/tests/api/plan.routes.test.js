const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../src/app');
const { Provider } = require('../../src/models/provider.model');
const Tool = require('../../src/models/tool.model');
const { ExperimentPlan } = require('../../src/models/experimentPlan.model');
const { Experiment } = require('../../src/models/experiment.model');

describe('Plan API Integration Tests', () => {
    let mongoServer;
    let validProviderId;
    let validToolId;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        await mongoose.connect(mongoUri);

        // Setup common data
        const provider = await Provider.create({
            name: 'Test Provider',
            type: 'OPENAI',
            baseUrl: 'http://test.com',
            apiKey: 'sk-test'
        });
        validProviderId = provider._id;

        const tool = await Tool.create({
            name: 'test_tool',
            namespace: 'test',
            description: 'A test tool',
            parameters: { type: 'object' },
            code: 'print("hello")'
        });
        validToolId = tool._id;
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    afterEach(async () => {
        await ExperimentPlan.deleteMany({});
    });

    describe('POST /api/plans', () => {
        const validPlanData = () => ({
            name: 'Integration Test Plan',
            description: 'Testing the API',
            roles: [
                {
                    name: 'Test Role',
                    systemPrompt: 'You are a test.',
                    modelConfig: {
                        provider: validProviderId,
                        modelName: 'gpt-4'
                    },
                    tools: [validToolId]
                }
            ],
            maxSteps: 10
        });

        it('should create a valid plan', async () => {
            const res = await request(app)
                .post('/api/plans')
                .send(validPlanData());

            expect(res.statusCode).toBe(201);
            expect(res.body.name).toBe('Integration Test Plan');
            expect(res.body._id).toBeDefined();

            const dbPlan = await ExperimentPlan.findById(res.body._id);
            expect(dbPlan).toBeTruthy();
        });

        it('should fail when provider ID does not exist', async () => {
            const planData = validPlanData();
            planData.roles[0].modelConfig.provider = new mongoose.Types.ObjectId(); // Random ID

            const res = await request(app)
                .post('/api/plans')
                .send(planData);

            expect(res.statusCode).toBe(400);
            expect(res.body.error).toBe('Validation Error');
            expect(res.body.messages[0]).toMatch(/Provider ID .* not found/);
        });

        it('should fail when tool ID does not exist', async () => {
            const planData = validPlanData();
            planData.roles[0].tools = [new mongoose.Types.ObjectId()]; // Random ID

            const res = await request(app)
                .post('/api/plans')
                .send(planData);

            expect(res.statusCode).toBe(400);
            expect(res.body.error).toBe('Validation Error');
            expect(res.body.messages[0]).toMatch(/Tool ID .* not found/);
        });

        it('should fail with duplicate plan name', async () => {
            await ExperimentPlan.create(validPlanData());

            const res = await request(app)
                .post('/api/plans')
                .send(validPlanData());

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toBe('Plan name must be unique.');
        });

        it('should fail with missing required fields', async () => {
            const res = await request(app)
                .post('/api/plans')
                .send({}); // Empty body

            expect(res.statusCode).toBe(400);
            // Expect mongoose validation errors structure (simplified check)
            expect(res.body.error).toBe('Validation Error');
            expect(res.body.messages).toBeDefined();
        });
    });

    describe('GET /api/plans', () => {
        const createPlan = async (name) => {
            return ExperimentPlan.create({
                name,
                description: 'Test Description',
                roles: [],
                maxSteps: 5,
                goals: [{ description: 'Goal 1', conditionScript: 'True' }]
            });
        };

        it('should return an empty list when no plans exist', async () => {
            const res = await request(app).get('/api/plans');
            expect(res.statusCode).toBe(200);
            expect(res.body).toEqual([]);
        });

        it('should return a list of plans with summary fields', async () => {
            await createPlan('Plan A');
            await createPlan('Plan B');

            const res = await request(app).get('/api/plans');

            expect(res.statusCode).toBe(200);
            expect(res.body.length).toBe(2);

            const planA = res.body.find(p => p.name === 'Plan A');
            expect(planA).toBeDefined();
            expect(planA.description).toBe('Test Description');
            expect(planA.roleCount).toBe(0);
            expect(planA.goalCount).toBe(1);
            expect(planA.createdAt).toBeDefined();
            expect(planA.updatedAt).toBeDefined();
        });
    });

    describe('GET /api/plans/:id', () => {
        let planId;

        beforeEach(async () => {
            const plan = await ExperimentPlan.create({
                name: 'Detail Test Plan',
                description: 'For testing get by ID',
                roles: [{
                    name: 'Test Role',
                    systemPrompt: 'sys prompt',
                    tools: [validToolId],
                    modelConfig: { provider: validProviderId, modelName: 'test-model' }
                }],
                maxSteps: 5
            });
            planId = plan._id;
        });

        it('should return a valid plan with populated tools', async () => {
            const res = await request(app).get(`/api/plans/${planId}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.name).toBe('Detail Test Plan');
            expect(res.body.roles[0].tools[0]).toHaveProperty('name', 'test_tool');
            expect(res.body.roles[0].tools[0]).toHaveProperty('namespace', 'test');
        });

        it('should return 404 if plan does not exist', async () => {
            const nonExistentId = new mongoose.Types.ObjectId();
            const res = await request(app).get(`/api/plans/${nonExistentId}`);

            expect(res.statusCode).toBe(404);
            expect(res.body.error).toBe('Plan not found');
        });

        it('should return 400 if ID is invalid', async () => {
            const res = await request(app).get('/api/plans/invalid-id-format');

            expect(res.statusCode).toBe(400);
            expect(res.body.error).toBe('Invalid ID format');
        });
    });

    describe('PUT /api/plans/:id', () => {
        let planId;

        beforeEach(async () => {
            const plan = await ExperimentPlan.create({
                name: 'Original Plan',
                description: 'Original Description',
                roles: [],
                maxSteps: 5
            });
            planId = plan._id;
        });

        it('should successfully update a plan', async () => {
            const updateData = {
                name: 'Updated Plan',
                description: 'Updated Description',
                maxSteps: 20
            };

            const res = await request(app)
                .put(`/api/plans/${planId}`)
                .send(updateData);

            expect(res.statusCode).toBe(200);
            expect(res.body.name).toBe('Updated Plan');
            expect(res.body.description).toBe('Updated Description');
            expect(res.body.maxSteps).toBe(20);

            // Verify in DB
            const dbPlan = await ExperimentPlan.findById(planId);
            expect(dbPlan.name).toBe('Updated Plan');
        });

        it('should update roles and validate references', async () => {
            const updateData = {
                roles: [
                    {
                        name: 'Updated Role',
                        systemPrompt: 'sys prompt',
                        tools: [validToolId],
                        modelConfig: { provider: validProviderId, modelName: 'test-model' }
                    }
                ]
            };

            const res = await request(app)
                .put(`/api/plans/${planId}`)
                .send(updateData);

            expect(res.statusCode).toBe(200);
            expect(res.body.roles.length).toBe(1);
            expect(res.body.roles[0].name).toBe('Updated Role');
        });

        it('should fail when provider ID does not exist in update', async () => {
            const updateData = {
                roles: [
                    {
                        name: 'Role',
                        systemPrompt: 'sys',
                        modelConfig: { provider: new mongoose.Types.ObjectId(), modelName: 'test' }
                    }
                ]
            };

            const res = await request(app)
                .put(`/api/plans/${planId}`)
                .send(updateData);

            expect(res.statusCode).toBe(400);
            expect(res.body.error).toBe('Validation Error');
        });

        it('should fail with duplicate plan name', async () => {
            await ExperimentPlan.create({
                name: 'Existing Plan',
                roles: [],
                maxSteps: 5
            });

            const res = await request(app)
                .put(`/api/plans/${planId}`)
                .send({ name: 'Existing Plan' });

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toBe('Plan name must be unique.');
        });

        it('should return 404 if plan does not exist', async () => {
            const nonExistentId = new mongoose.Types.ObjectId();
            const res = await request(app)
                .put(`/api/plans/${nonExistentId}`)
                .send({ name: 'New Name' });

            expect(res.statusCode).toBe(404);
            expect(res.body.error).toBe('Plan not found');
        });

        it('should return 400 if ID is invalid', async () => {
            const res = await request(app).put('/api/plans/invalid-id');
            expect(res.statusCode).toBe(400);
            expect(res.body.error).toBe('Invalid ID format');
        });
    });

    describe('DELETE /api/plans/:id', () => {
        let planId;

        beforeEach(async () => {
            const plan = await ExperimentPlan.create({
                name: 'Delete Test Plan',
                description: 'To be deleted',
                roles: [],
                maxSteps: 5
            });
            planId = plan._id;
        });

        afterEach(async () => {
            await Experiment.deleteMany({});
        });

        it('should successfully delete an unused plan', async () => {
            const res = await request(app).delete(`/api/plans/${planId}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.message).toBe('Plan deleted successfully');
            expect(res.body.id.toString()).toBe(planId.toString());

            const dbPlan = await ExperimentPlan.findById(planId);
            expect(dbPlan).toBeNull();
        });

        it('should return 409 if plan is used by an experiment', async () => {
            // Create a referencing experiment
            await Experiment.create({
                planId: planId,
                status: 'INITIALIZING',
                currentStep: 0
            });

            const res = await request(app).delete(`/api/plans/${planId}`);

            expect(res.statusCode).toBe(409);
            expect(res.body.error).toBe('Conflict');
            expect(res.body.message).toMatch(/being used by 1 experiment/);

            // Verify plan still exists
            const dbPlan = await ExperimentPlan.findById(planId);
            expect(dbPlan).toBeTruthy();
        });

        it('should return 404 if plan does not exist', async () => {
            const nonExistentId = new mongoose.Types.ObjectId();
            const res = await request(app).delete(`/api/plans/${nonExistentId}`);

            expect(res.statusCode).toBe(404);
            expect(res.body.error).toBe('Plan not found');
        });

        it('should return 400 if ID is invalid', async () => {
            const res = await request(app).delete('/api/plans/invalid-id');
            expect(res.statusCode).toBe(400);
            expect(res.body.error).toBe('Invalid ID format');
        });
    });

    describe('POST /api/plans/:id/duplicate', () => {
        let planId;

        beforeEach(async () => {
            const plan = await ExperimentPlan.create({
                name: 'Source Plan',
                description: 'Original Description',
                roles: [{
                    name: 'Role 1',
                    systemPrompt: 'prompt',
                    tools: [validToolId],
                    modelConfig: { provider: validProviderId, modelName: 'test' }
                }],
                goals: [{ description: 'Goal A', conditionScript: 'true' }],
                maxSteps: 5
            });
            planId = plan._id;
        });

        it('should duplicate a plan with a new name', async () => {
            const res = await request(app).post(`/api/plans/${planId}/duplicate`);

            expect(res.statusCode).toBe(201);
            expect(res.body.name).toBe('Source Plan (Copy)');
            expect(res.body.description).toBe('Original Description');
            expect(res.body._id).not.toBe(planId.toString());
            expect(res.body.roles.length).toBe(1);
            expect(res.body.roles[0].name).toBe('Role 1');
            expect(res.body.goals.length).toBe(1);
        });

        it('should handle name collisions by incrementing suffix', async () => {
            // First Copy
            await request(app).post(`/api/plans/${planId}/duplicate`);

            // Second Copy
            const res = await request(app).post(`/api/plans/${planId}/duplicate`);

            expect(res.statusCode).toBe(201);
            expect(res.body.name).toBe('Source Plan (Copy 2)');
        });

        it('should allow providing a custom name', async () => {
            const res = await request(app)
                .post(`/api/plans/${planId}/duplicate`)
                .send({ name: 'My Custom Copy' });

            expect(res.statusCode).toBe(201);
            expect(res.body.name).toBe('My Custom Copy');
        });

        it('should return 404 if source plan not found', async () => {
            const nonExistentId = new mongoose.Types.ObjectId();
            const res = await request(app).post(`/api/plans/${nonExistentId}/duplicate`);

            expect(res.statusCode).toBe(404);
        });
    });
});
