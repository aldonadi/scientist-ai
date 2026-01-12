const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const experimentRoutes = require('./experiment.routes'); // Ensure this exports the router
const { Experiment } = require('../models/experiment.model');
const { ExperimentPlan } = require('../models/experimentPlan.model');

// Mock Orchestrator to prevent actual start() behavior (checking DB, etc) from interfering too much
// We want to test the Controller logic primarily here.
// But start() is called. We can mock the service module.
jest.mock('../services/experiment-orchestrator.service', () => {
    return {
        ExperimentOrchestrator: jest.fn().mockImplementation(() => {
            return {
                start: jest.fn().mockResolvedValue()
            };
        })
    };
});

const app = express();
app.use(express.json());
app.use('/api/experiments', experimentRoutes);

// Error handler
app.use((err, req, res, next) => {
    res.status(500).json({ error: err.message });
});

describe('Experiment Control API Integration', () => {
    let mongoServer;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        await mongoose.connect(mongoServer.getUri());
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    afterEach(async () => {
        await Experiment.deleteMany({});
        await ExperimentPlan.deleteMany({});
    });

    const createExperiment = async (status) => {
        const plan = new ExperimentPlan({
            name: 'Test Plan',
            initialEnvironment: { foo: 'bar' },
            roles: [],
            goals: [],
            maxSteps: 10
        });
        await plan.save();

        const experiment = new Experiment({
            planId: plan._id,
            status: status,
            currentEnvironment: plan.initialEnvironment,
            startTime: new Date()
        });
        await experiment.save();
        return experiment;
    };

    /**
     * Matrix of expected results
     * Format: [InitialState, Command, ExpectedStatus (or 'ERROR')]
     * 
     * Idempotency assumption:
     * - PAUSE on PAUSED -> OK (PAUSED)
     * - RESUME on RUNNING -> ERROR (not explicitly handled to be idempotent in code, logic says !== RUNNING -> 400)
     * - STOP on STOPPED -> ERROR
     */
    const transitions = [
        // INITIALIZING
        ['INITIALIZING', 'PAUSE', 'ERROR'],
        ['INITIALIZING', 'RESUME', 'ERROR'],
        ['INITIALIZING', 'STOP', 'STOPPED'],

        // RUNNING
        ['RUNNING', 'PAUSE', 'PAUSED'],
        ['RUNNING', 'RESUME', 'RUNNING'],
        ['RUNNING', 'STOP', 'STOPPED'],

        // PAUSED
        ['PAUSED', 'PAUSE', 'PAUSED'], // Idempotent
        ['PAUSED', 'RESUME', 'RUNNING'],
        ['PAUSED', 'STOP', 'STOPPED'],

        // STOPPED
        ['STOPPED', 'PAUSE', 'ERROR'],
        ['STOPPED', 'RESUME', 'ERROR'],
        ['STOPPED', 'STOP', 'ERROR'],

        // COMPLETED
        ['COMPLETED', 'PAUSE', 'ERROR'],
        ['COMPLETED', 'RESUME', 'ERROR'],
        ['COMPLETED', 'STOP', 'ERROR'],

        // FAILED
        ['FAILED', 'PAUSE', 'ERROR'],
        ['FAILED', 'RESUME', 'ERROR'],
        ['FAILED', 'STOP', 'ERROR']
    ];

    test.each(transitions)(
        'Transition from %s with %s should result in %s',
        async (initialState, command, expectedResult) => {
            const experiment = await createExperiment(initialState);
            const res = await request(app)
                .post(`/api/experiments/${experiment._id}/control`)
                .send({ command });

            if (expectedResult === 'ERROR') {
                if (res.status === 200) {
                    console.error(`Unexpected success for ${initialState} + ${command}. Response:`, res.body);
                }
                expect(res.status).toBe(400);
                expect(res.body.error).toBe(true);
            } else {
                if (res.status !== 200) {
                    console.error(`Unexpected failure for ${initialState} + ${command}. Response:`, res.body);
                }
                expect(res.status).toBe(200);
                expect(res.body.success).toBe(true);
                expect(res.body.newStatus).toBe(expectedResult);

                // Verify DB
                const updated = await Experiment.findById(experiment._id);
                expect(updated.status).toBe(expectedResult);
            }
        }
    );

    it('should return 404 for non-existent experiment', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app)
            .post(`/api/experiments/${fakeId}/control`)
            .send({ command: 'PAUSE' });
        expect(res.status).toBe(404);
    });

    it('should return 400 for invalid command', async () => {
        const experiment = await createExperiment('RUNNING');
        const res = await request(app)
            .post(`/api/experiments/${experiment._id}/control`)
            .send({ command: 'INVALID' });
        expect(res.status).toBe(400);
    });
});
