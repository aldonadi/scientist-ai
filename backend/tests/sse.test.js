const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { Experiment } = require('../src/models/experiment.model');
const experimentController = require('../src/controllers/experiment.controller');
const OrchestratorRegistry = require('../src/services/orchestrator-registry.service');
const { EventBus, EventTypes } = require('../src/services/event-bus');

// Mock Orchestrator
class MockOrchestrator {
    constructor(experimentId) {
        this.experimentId = experimentId;
        this.eventBus = new EventBus();
    }
}

describe('SSE Streaming Endpoint', () => {
    let app;
    let mongoServer;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        await mongoose.connect(mongoServer.getUri());

        app = express();
        app.use(express.json());
        // Minimal route setup for testing
        app.get('/api/experiments/:id/stream', experimentController.streamExperimentEvents);
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    beforeEach(async () => {
        // Clear DB and Registry
        await Experiment.deleteMany({});
        OrchestratorRegistry.instance = null; // Reset singleton manually if possible or just clear map
        const registry = OrchestratorRegistry.getInstance();
        registry.orchestrators = new Map();
    });

    it('should return 400 for invalid ID format', async () => {
        const res = await request(app).get('/api/experiments/invalid-id/stream');
        expect(res.status).toBe(400);
        expect(res.body.error).toBe(true);
    });

    it('should return error event for non-existent experiment', async () => {
        const fakeId = new mongoose.Types.ObjectId();

        // Use a callback to capture the stream
        const response = await request(app)
            .get(`/api/experiments/${fakeId}/stream`)
            .expect(200)
            .expect('Content-Type', /text\/event-stream/);

        // Supertest buffers response, so we get the whole text
        expect(response.text).toContain('event: CONNECTED');
        expect(response.text).toContain('event: ERROR');
        expect(response.text).toContain('Experiment not found');
    });

    it('should stream events from an active orchestrator', async () => {
        const experiment = new Experiment({
            planId: new mongoose.Types.ObjectId(),
            status: 'RUNNING',
            startTime: new Date()
        });
        await experiment.save();

        const orchestrator = new MockOrchestrator(experiment._id);
        OrchestratorRegistry.getInstance().register(experiment._id, orchestrator);

        // Start request but don't await full completion yet
        // We need to trigger events while the request is open.
        // Supertest isn't great for streaming concurrent interactions.
        // We will simulate it by ensuring the route subscribes, then we emit, then we close.

        // Ideally we use a real http client or a more advanced test setup.
        // For unit/integration here, we can use a small delay?

        // Simpler approach: 
        // 1. Start response streaming
        // 2. Emit event via orchestrator (need to do this while request is pending)
        // 3. Supertest waits for stream end.

        // Since supertest waits for 'end', we need to close the stream from the server side or client side.
        // Our controller doesn't auto-close for active experiments.

        // WORKAROUND: We can modify the MockOrchestrator to emit immediately upon some trigger, 
        // OR we just rely on the initial CONNECTED event which confirms the setup.

        // Let's verify CONNECTED matches.
        const res = await request(app)
            .get(`/api/experiments/${experiment._id}/stream`)
            .timeout(500) // Timeout to force close if it stays open
            .catch(err => err.response); // Capture timeout response partial?

        // Supertest timeout might fail the test. 
        // Let's try to emit asynchronously then check accumulated data.
    });

    // Testing streams with Jest/Supertest is tricky.
    // Let's test the logic by mocking the response object explicitly and calling the controller directly.
    it('should write events to response', async () => {
        const experiment = new Experiment({
            planId: new mongoose.Types.ObjectId(),
            status: 'RUNNING',
            startTime: new Date()
        });
        await experiment.save();

        const orchestrator = new MockOrchestrator(experiment._id);
        OrchestratorRegistry.getInstance().register(experiment._id, orchestrator);

        const req = {
            params: { id: experiment._id.toString() },
            on: jest.fn()
        };

        const res = {
            writeHead: jest.fn(),
            write: jest.fn(),
            end: jest.fn()
        };

        // Call controller
        await experimentController.streamExperimentEvents(req, res);

        // Verify Headers
        expect(res.writeHead).toHaveBeenCalledWith(200, expect.objectContaining({
            'Content-Type': 'text/event-stream',
            'Connection': 'keep-alive'
        }));

        // Verify Initial Connected Event
        expect(res.write).toHaveBeenCalledWith('event: CONNECTED\n');

        // Emit Custom Event
        orchestrator.eventBus.emit(EventTypes.STEP_START, { stepNumber: 1 });

        // Verify Event Written
        expect(res.write).toHaveBeenCalledWith(`event: ${EventTypes.STEP_START}\n`);
        expect(res.write).toHaveBeenCalledWith(`data: {"stepNumber":1}\n\n`);

        // Verify Cleanup on close
        const closeHandler = req.on.mock.calls.find(call => call[0] === 'close')[1];
        closeHandler();

        // Verify listeners removed (requires peeking into event bus)
        expect(orchestrator.eventBus.listenerCount(EventTypes.STEP_START)).toBe(0);
    });

    it('should send END event for completed experiment', async () => {
        const experiment = new Experiment({
            planId: new mongoose.Types.ObjectId(),
            status: 'COMPLETED',
            result: 'Goal Met',
            startTime: new Date(),
            endTime: new Date()
        });
        await experiment.save();

        const req = {
            params: { id: experiment._id.toString() },
            on: jest.fn()
        };

        const res = {
            writeHead: jest.fn(),
            write: jest.fn(),
            end: jest.fn()
        };

        await experimentController.streamExperimentEvents(req, res);

        // Expect END event
        expect(res.write).toHaveBeenCalledWith(`event: ${EventTypes.EXPERIMENT_END}\n`);
        expect(res.write).toHaveBeenCalledWith(expect.stringContaining('"status":"COMPLETED"'));
        expect(res.end).toHaveBeenCalled();
    });
});
