const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../src/app');
const { ExperimentPlan } = require('../../src/models/experimentPlan.model');
const { Experiment } = require('../../src/models/experiment.model');

describe('Experiment API Integration Tests', () => {
    let mongoServer;
    let validPlanId;

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
        await Experiment.deleteMany({});
        await ExperimentPlan.deleteMany({});
    });

    describe('POST /api/experiments', () => {
        beforeEach(async () => {
            const plan = await ExperimentPlan.create({
                name: 'Test Plan',
                description: 'For testing launch',
                roles: [],
                maxSteps: 10,
                initialEnvironment: {
                    variables: { key: 'value' },
                    variableTypes: { key: 'string' }
                }
            });
            validPlanId = plan._id;
        });

        it('should launch a new experiment from a valid plan', async () => {
            const res = await request(app)
                .post('/api/experiments')
                .send({ planId: validPlanId });

            expect(res.statusCode).toBe(201);
            expect(res.body.status).toBe('INITIALIZING');
            expect(res.body.planId).toBe(validPlanId.toString());
            expect(res.body.currentEnvironment.variables).toEqual(expect.objectContaining({ key: 'value' }));

            // Verify in DB
            const dbExperiment = await Experiment.findById(res.body._id);
            expect(dbExperiment).toBeTruthy();
            expect(dbExperiment.status).toBe('INITIALIZING');
        });

        it('should fail if planId is missing', async () => {
            const res = await request(app)
                .post('/api/experiments')
                .send({});

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toBe('planId is required');
        });

        it('should fail if planId is invalid format', async () => {
            const res = await request(app)
                .post('/api/experiments')
                .send({ planId: 'invalid-id' });

            expect(res.statusCode).toBe(500); // Mongoose cast error usually results in 500 unless handled specifically
        });

        it('should fail if plan does not exist', async () => {
            const nonExistentId = new mongoose.Types.ObjectId();
            const res = await request(app)
                .post('/api/experiments')
                .send({ planId: nonExistentId });

            expect(res.statusCode).toBe(404);
            expect(res.body.message).toBe('Experiment Plan not found');
        });
    });
});
