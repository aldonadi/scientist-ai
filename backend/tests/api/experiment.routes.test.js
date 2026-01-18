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

    describe('GET /api/experiments/:id/logs', () => {
        let validExperimentId;

        beforeEach(async () => {
            const plan = await ExperimentPlan.create({
                name: 'Test Plan',
                description: 'For testing logs',
                roles: [],
                maxSteps: 10
            });
            validPlanId = plan._id;

            const experiment = await Experiment.create({
                planId: validPlanId,
                status: 'RUNNING',
                currentStep: 5
            });
            validExperimentId = experiment._id;
        });

        it('should return logs array for valid experiment', async () => {
            await Log.create([
                { experimentId: validExperimentId, stepNumber: 1, source: 'System', message: 'Step 1 started' },
                { experimentId: validExperimentId, stepNumber: 2, source: 'System', message: 'Step 2 started' }
            ]);

            const res = await request(app).get(`/api/experiments/${validExperimentId}/logs`);

            expect(res.statusCode).toBe(200);
            expect(res.body.logs).toHaveLength(2);
            expect(res.body.logs[0]).toHaveProperty('_id');
            expect(res.body.logs[0]).toHaveProperty('experimentId');
            expect(res.body.logs[0]).toHaveProperty('stepNumber');
            expect(res.body.logs[0]).toHaveProperty('source');
            expect(res.body.logs[0]).toHaveProperty('message');
            expect(res.body.logs[0]).toHaveProperty('timestamp');
        });

        it('should return 404 for non-existent experiment', async () => {
            const nonExistentId = new mongoose.Types.ObjectId();

            const res = await request(app).get(`/api/experiments/${nonExistentId}/logs`);

            expect(res.statusCode).toBe(404);
            expect(res.body.error).toBe(true);
            expect(res.body.message).toBe('Experiment not found');
        });

        it('should return 400 for invalid ObjectId format', async () => {
            const res = await request(app).get('/api/experiments/invalid-id-format/logs');

            expect(res.statusCode).toBe(400);
            expect(res.body.error).toBe(true);
            expect(res.body.message).toBe('Invalid ID format');
        });

        it('should return empty array for experiment with no logs', async () => {
            const res = await request(app).get(`/api/experiments/${validExperimentId}/logs`);

            expect(res.statusCode).toBe(200);
            expect(res.body.logs).toEqual([]);
            expect(res.body.pagination.total).toBe(0);
        });

        it('should filter logs by step number', async () => {
            await Log.create([
                { experimentId: validExperimentId, stepNumber: 1, source: 'System', message: 'Step 1' },
                { experimentId: validExperimentId, stepNumber: 2, source: 'System', message: 'Step 2' },
                { experimentId: validExperimentId, stepNumber: 1, source: 'Tool', message: 'Tool in step 1' }
            ]);

            const res = await request(app).get(`/api/experiments/${validExperimentId}/logs?step=1`);

            expect(res.statusCode).toBe(200);
            expect(res.body.logs).toHaveLength(2);
            res.body.logs.forEach(log => {
                expect(log.stepNumber).toBe(1);
            });
        });

        it('should return 400 for invalid step parameter', async () => {
            const res = await request(app).get(`/api/experiments/${validExperimentId}/logs?step=abc`);

            expect(res.statusCode).toBe(400);
            expect(res.body.error).toBe(true);
            expect(res.body.message).toBe('Invalid step parameter, must be a number');
        });

        it('should filter logs by source', async () => {
            await Log.create([
                { experimentId: validExperimentId, stepNumber: 1, source: 'System', message: 'System log' },
                { experimentId: validExperimentId, stepNumber: 1, source: 'Tool', message: 'Tool log' },
                { experimentId: validExperimentId, stepNumber: 2, source: 'System', message: 'Another system log' }
            ]);

            const res = await request(app).get(`/api/experiments/${validExperimentId}/logs?source=Tool`);

            expect(res.statusCode).toBe(200);
            expect(res.body.logs).toHaveLength(1);
            expect(res.body.logs[0].source).toBe('Tool');
        });

        it('should combine step and source filters', async () => {
            await Log.create([
                { experimentId: validExperimentId, stepNumber: 1, source: 'System', message: 'Sys 1' },
                { experimentId: validExperimentId, stepNumber: 1, source: 'Tool', message: 'Tool 1' },
                { experimentId: validExperimentId, stepNumber: 2, source: 'System', message: 'Sys 2' },
                { experimentId: validExperimentId, stepNumber: 2, source: 'Tool', message: 'Tool 2' }
            ]);

            const res = await request(app).get(`/api/experiments/${validExperimentId}/logs?step=1&source=Tool`);

            expect(res.statusCode).toBe(200);
            expect(res.body.logs).toHaveLength(1);
            expect(res.body.logs[0].message).toBe('Tool 1');
        });

        it('should return logs in chronological order (oldest first)', async () => {
            const oldTime = new Date('2020-01-01T00:00:00Z');
            const midTime = new Date('2022-06-15T12:00:00Z');
            const newTime = new Date('2025-01-01T00:00:00Z');

            await Log.create([
                { experimentId: validExperimentId, stepNumber: 1, source: 'System', message: 'Newest', timestamp: newTime },
                { experimentId: validExperimentId, stepNumber: 1, source: 'System', message: 'Oldest', timestamp: oldTime },
                { experimentId: validExperimentId, stepNumber: 1, source: 'System', message: 'Middle', timestamp: midTime }
            ]);

            const res = await request(app).get(`/api/experiments/${validExperimentId}/logs`);

            expect(res.statusCode).toBe(200);
            expect(res.body.logs).toHaveLength(3);
            expect(res.body.logs[0].message).toBe('Oldest');
            expect(res.body.logs[1].message).toBe('Middle');
            expect(res.body.logs[2].message).toBe('Newest');
        });

        it('should respect pagination limit', async () => {
            // Create 10 logs
            const logs = [];
            for (let i = 0; i < 10; i++) {
                logs.push({
                    experimentId: validExperimentId,
                    stepNumber: i,
                    source: 'System',
                    message: `Log ${i}`
                });
            }
            await Log.create(logs);

            const res = await request(app).get(`/api/experiments/${validExperimentId}/logs?limit=3`);

            expect(res.statusCode).toBe(200);
            expect(res.body.logs).toHaveLength(3);
            expect(res.body.pagination.limit).toBe(3);
            expect(res.body.pagination.total).toBe(10);
            expect(res.body.pagination.hasMore).toBe(true);
        });

        it('should respect pagination offset', async () => {
            const logs = [];
            for (let i = 0; i < 5; i++) {
                logs.push({
                    experimentId: validExperimentId,
                    stepNumber: i,
                    source: 'System',
                    message: `Log ${i}`,
                    timestamp: new Date(2020, 0, i + 1)
                });
            }
            await Log.create(logs);

            const res = await request(app).get(`/api/experiments/${validExperimentId}/logs?limit=2&offset=2`);

            expect(res.statusCode).toBe(200);
            expect(res.body.logs).toHaveLength(2);
            expect(res.body.logs[0].message).toBe('Log 2');
            expect(res.body.logs[1].message).toBe('Log 3');
            expect(res.body.pagination.offset).toBe(2);
        });

        it('should return hasMore=false when at end', async () => {
            await Log.create([
                { experimentId: validExperimentId, stepNumber: 1, source: 'System', message: 'Log 1' },
                { experimentId: validExperimentId, stepNumber: 2, source: 'System', message: 'Log 2' }
            ]);

            const res = await request(app).get(`/api/experiments/${validExperimentId}/logs?limit=2`);

            expect(res.statusCode).toBe(200);
            expect(res.body.logs).toHaveLength(2);
            expect(res.body.pagination.hasMore).toBe(false);
        });

        it('should cap limit at MAX_LIMIT (500)', async () => {
            const res = await request(app).get(`/api/experiments/${validExperimentId}/logs?limit=1000`);

            expect(res.statusCode).toBe(200);
            expect(res.body.pagination.limit).toBe(500);
        });

        it('should use default limit when not specified', async () => {
            const res = await request(app).get(`/api/experiments/${validExperimentId}/logs`);

            expect(res.statusCode).toBe(200);
            expect(res.body.pagination.limit).toBe(50);
        });

        it('should include data field when present on log entry', async () => {
            await Log.create({
                experimentId: validExperimentId,
                stepNumber: 1,
                source: 'Tool',
                message: 'Tool executed',
                data: { result: 'success', value: 42 }
            });

            const res = await request(app).get(`/api/experiments/${validExperimentId}/logs`);

            expect(res.statusCode).toBe(200);
            expect(res.body.logs[0].data).toBeDefined();
            expect(res.body.logs[0].data.result).toBe('success');
            expect(res.body.logs[0].data.value).toBe(42);
        });

        it('should not include data field when not set', async () => {
            await Log.create({
                experimentId: validExperimentId,
                stepNumber: 1,
                source: 'System',
                message: 'Simple log'
            });

            const res = await request(app).get(`/api/experiments/${validExperimentId}/logs`);

            expect(res.statusCode).toBe(200);
            expect(res.body.logs[0].data).toBeUndefined();
        });

        it('should not return logs from other experiments', async () => {
            const otherExperiment = await Experiment.create({
                planId: validPlanId,
                status: 'RUNNING',
                currentStep: 3
            });

            await Log.create([
                { experimentId: validExperimentId, stepNumber: 1, source: 'System', message: 'Our log' },
                { experimentId: otherExperiment._id, stepNumber: 1, source: 'System', message: 'Other log' }
            ]);

            const res = await request(app).get(`/api/experiments/${validExperimentId}/logs`);

            expect(res.statusCode).toBe(200);
            expect(res.body.logs).toHaveLength(1);
            expect(res.body.logs[0].message).toBe('Our log');
        });
    });
});

