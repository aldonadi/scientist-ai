const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../src/app');
const { ExperimentPlan } = require('../../src/models/experimentPlan.model');
const { Experiment } = require('../../src/models/experiment.model');
const Log = require('../../src/models/log.model');

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
        await Log.deleteMany({});
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

    describe('GET /api/experiments', () => {
        beforeEach(async () => {
            const plan = await ExperimentPlan.create({
                name: 'Test Plan',
                description: 'For testing list',
                roles: [],
                maxSteps: 10
            });
            validPlanId = plan._id;
        });

        it('should return empty array when no experiments exist', async () => {
            const res = await request(app).get('/api/experiments');

            expect(res.statusCode).toBe(200);
            expect(res.body).toEqual([]);
        });

        it('should return all experiments', async () => {
            await Experiment.create([
                { planId: validPlanId, status: 'RUNNING', currentStep: 1 },
                { planId: validPlanId, status: 'COMPLETED', currentStep: 5, result: 'Goal Met' }
            ]);

            const res = await request(app).get('/api/experiments');

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveLength(2);
            expect(res.body[0]).toHaveProperty('_id');
            expect(res.body[0]).toHaveProperty('planId');
            expect(res.body[0]).toHaveProperty('status');
            expect(res.body[0]).toHaveProperty('currentStep');
            expect(res.body[0]).toHaveProperty('startTime');
        });

        it('should filter by status when query param provided', async () => {
            await Experiment.create([
                { planId: validPlanId, status: 'RUNNING', currentStep: 1 },
                { planId: validPlanId, status: 'COMPLETED', currentStep: 5, result: 'Goal Met' },
                { planId: validPlanId, status: 'RUNNING', currentStep: 2 }
            ]);

            const res = await request(app).get('/api/experiments?status=RUNNING');

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveLength(2);
            res.body.forEach(exp => {
                expect(exp.status).toBe('RUNNING');
            });
        });

        it('should return 400 for invalid status filter', async () => {
            const res = await request(app).get('/api/experiments?status=INVALID_STATUS');

            expect(res.statusCode).toBe(400);
            expect(res.body.error).toBe(true);
            expect(res.body.message).toContain('Invalid status filter');
        });

        it('should include endTime and result for ended experiments', async () => {
            const endTime = new Date();
            await Experiment.create({
                planId: validPlanId,
                status: 'COMPLETED',
                currentStep: 10,
                endTime: endTime,
                result: 'Goal Met'
            });

            const res = await request(app).get('/api/experiments');

            expect(res.statusCode).toBe(200);
            expect(res.body[0].endTime).toBeTruthy();
            expect(res.body[0].result).toBe('Goal Met');
        });

        it('should sort experiments by startTime descending', async () => {
            const oldDate = new Date('2020-01-01');
            const newDate = new Date('2025-01-01');

            await Experiment.create([
                { planId: validPlanId, status: 'RUNNING', startTime: oldDate },
                { planId: validPlanId, status: 'RUNNING', startTime: newDate }
            ]);

            const res = await request(app).get('/api/experiments');

            expect(res.statusCode).toBe(200);
            expect(new Date(res.body[0].startTime).getTime()).toBeGreaterThan(
                new Date(res.body[1].startTime).getTime()
            );
        });
    });

    describe('GET /api/experiments/:id', () => {
        beforeEach(async () => {
            const plan = await ExperimentPlan.create({
                name: 'Test Plan',
                description: 'For testing get',
                roles: [],
                maxSteps: 10
            });
            validPlanId = plan._id;
        });

        it('should return full experiment document including currentEnvironment', async () => {
            const experiment = await Experiment.create({
                planId: validPlanId,
                status: 'RUNNING',
                currentStep: 3,
                currentEnvironment: {
                    variables: { testVar: 'testValue' },
                    variableTypes: { testVar: 'string' }
                }
            });

            const res = await request(app).get(`/api/experiments/${experiment._id}`);

            expect(res.statusCode).toBe(200);
            expect(res.body._id).toBe(experiment._id.toString());
            expect(res.body.status).toBe('RUNNING');
            expect(res.body.currentEnvironment).toBeDefined();
            expect(res.body.currentEnvironment.variables.testVar).toBe('testValue');
        });

        it('should return 404 for non-existent experiment', async () => {
            const nonExistentId = new mongoose.Types.ObjectId();

            const res = await request(app).get(`/api/experiments/${nonExistentId}`);

            expect(res.statusCode).toBe(404);
            expect(res.body.error).toBe(true);
            expect(res.body.message).toBe('Experiment not found');
        });

        it('should return 400 for invalid ObjectId format', async () => {
            const res = await request(app).get('/api/experiments/invalid-id-format');

            expect(res.statusCode).toBe(400);
            expect(res.body.error).toBe(true);
            expect(res.body.message).toBe('Invalid ID format');
        });
    });

    describe('DELETE /api/experiments/:id', () => {
        beforeEach(async () => {
            const plan = await ExperimentPlan.create({
                name: 'Test Plan',
                description: 'For testing delete',
                roles: [],
                maxSteps: 10
            });
            validPlanId = plan._id;
        });

        it('should return 204 when deleting COMPLETED experiment', async () => {
            const experiment = await Experiment.create({
                planId: validPlanId,
                status: 'COMPLETED',
                currentStep: 10,
                result: 'Goal Met'
            });

            const res = await request(app).delete(`/api/experiments/${experiment._id}`);

            expect(res.statusCode).toBe(204);

            // Verify deleted from DB
            const dbExperiment = await Experiment.findById(experiment._id);
            expect(dbExperiment).toBeNull();
        });

        it('should return 204 when deleting FAILED experiment', async () => {
            const experiment = await Experiment.create({
                planId: validPlanId,
                status: 'FAILED',
                currentStep: 5,
                result: 'Error occurred'
            });

            const res = await request(app).delete(`/api/experiments/${experiment._id}`);

            expect(res.statusCode).toBe(204);
        });

        it('should return 204 when deleting STOPPED experiment', async () => {
            const experiment = await Experiment.create({
                planId: validPlanId,
                status: 'STOPPED',
                currentStep: 3,
                result: 'Stopped by User'
            });

            const res = await request(app).delete(`/api/experiments/${experiment._id}`);

            expect(res.statusCode).toBe(204);
        });

        it('should return 400 when trying to delete RUNNING experiment', async () => {
            const experiment = await Experiment.create({
                planId: validPlanId,
                status: 'RUNNING',
                currentStep: 3
            });

            const res = await request(app).delete(`/api/experiments/${experiment._id}`);

            expect(res.statusCode).toBe(400);
            expect(res.body.error).toBe(true);
            expect(res.body.message).toContain('Cannot delete experiment in state RUNNING');
        });

        it('should return 400 when trying to delete PAUSED experiment', async () => {
            const experiment = await Experiment.create({
                planId: validPlanId,
                status: 'PAUSED',
                currentStep: 3
            });

            const res = await request(app).delete(`/api/experiments/${experiment._id}`);

            expect(res.statusCode).toBe(400);
            expect(res.body.error).toBe(true);
            expect(res.body.message).toContain('Cannot delete experiment in state PAUSED');
        });

        it('should return 400 when trying to delete INITIALIZING experiment', async () => {
            const experiment = await Experiment.create({
                planId: validPlanId,
                status: 'INITIALIZING',
                currentStep: 0
            });

            const res = await request(app).delete(`/api/experiments/${experiment._id}`);

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toContain('Cannot delete experiment in state INITIALIZING');
        });

        it('should return 404 for non-existent experiment', async () => {
            const nonExistentId = new mongoose.Types.ObjectId();

            const res = await request(app).delete(`/api/experiments/${nonExistentId}`);

            expect(res.statusCode).toBe(404);
            expect(res.body.error).toBe(true);
            expect(res.body.message).toBe('Experiment not found');
        });

        it('should return 400 for invalid ObjectId format', async () => {
            const res = await request(app).delete('/api/experiments/invalid-id-format');

            expect(res.statusCode).toBe(400);
            expect(res.body.error).toBe(true);
            expect(res.body.message).toBe('Invalid ID format');
        });

        it('should also delete associated logs when experiment is deleted', async () => {
            const experiment = await Experiment.create({
                planId: validPlanId,
                status: 'COMPLETED',
                currentStep: 5,
                result: 'Goal Met'
            });

            // Create some logs associated with the experiment
            await Log.create([
                { experimentId: experiment._id, stepNumber: 1, source: 'System', message: 'Step 1 started' },
                { experimentId: experiment._id, stepNumber: 2, source: 'System', message: 'Step 2 started' },
                { experimentId: experiment._id, stepNumber: 3, source: 'Tool', message: 'Tool executed' }
            ]);

            // Verify logs exist
            const logsBefore = await Log.countDocuments({ experimentId: experiment._id });
            expect(logsBefore).toBe(3);

            // Delete experiment
            const res = await request(app).delete(`/api/experiments/${experiment._id}`);
            expect(res.statusCode).toBe(204);

            // Verify logs are deleted
            const logsAfter = await Log.countDocuments({ experimentId: experiment._id });
            expect(logsAfter).toBe(0);
        });
    });
});

