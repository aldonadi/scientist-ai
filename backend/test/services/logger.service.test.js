const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { EventBus, EventTypes } = require('../../src/services/event-bus');
const Logger = require('../../src/services/logger.service');
const Log = require('../../src/models/log.model');

describe('Logger Service', () => {
    let mongoServer;
    let eventBus;
    let logger;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        await mongoose.connect(uri);
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    beforeEach(async () => {
        await Log.deleteMany({});
        eventBus = new EventBus();
        logger = new Logger(eventBus);
    });

    it('should create a log entry when LOG event is emitted', async () => {
        const experimentId = new mongoose.Types.ObjectId();
        const payload = {
            experimentId,
            stepNumber: 1,
            source: 'Test',
            message: 'Hello World',
            data: { key: 'value' }
        };

        eventBus.emit(EventTypes.LOG, payload);

        // Wait a bit for async DB write
        await new Promise(resolve => setTimeout(resolve, 100));

        const logs = await Log.find();
        expect(logs).toHaveLength(1);
        expect(logs[0].experimentId.toString()).toBe(experimentId.toString());
        expect(logs[0].message).toBe('Hello World');
        expect(logs[0].stepNumber).toBe(1);
        expect(logs[0].data).toEqual({ key: 'value' });
    });

    it('should invalid log entry fail silently (console error) but not crash', async () => {
        // Missing required fields
        const payload = {
            source: 'Test'
        };

        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
        eventBus.emit(EventTypes.LOG, payload);

        await new Promise(resolve => setTimeout(resolve, 100));

        const logs = await Log.find();
        expect(logs).toHaveLength(0);
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
    });

    it('should auto-log EXPERIMENT_START', async () => {
        const experimentId = new mongoose.Types.ObjectId();
        eventBus.emit(EventTypes.EXPERIMENT_START, { experimentId, planName: 'Test Plan' });

        await new Promise(resolve => setTimeout(resolve, 100));

        const logs = await Log.find();
        expect(logs).toHaveLength(1);
        expect(logs[0].message).toContain('Experiment Initialized from plan: Test Plan');
        expect(logs[0].source).toBe('System');
        expect(logs[0].stepNumber).toBe(0);
    });

    it('should auto-log STEP_START', async () => {
        const experimentId = new mongoose.Types.ObjectId();
        eventBus.emit(EventTypes.STEP_START, { experimentId, stepNumber: 5 });

        await new Promise(resolve => setTimeout(resolve, 100));

        const logs = await Log.find();
        expect(logs).toHaveLength(1);
        expect(logs[0].message).toBe('Step 5 Started');
        expect(logs[0].stepNumber).toBe(5);
    });

    it('should auto-log EXPERIMENT_END', async () => {
        const experimentId = new mongoose.Types.ObjectId();
        eventBus.emit(EventTypes.EXPERIMENT_END, { experimentId, result: 'Success' });

        await new Promise(resolve => setTimeout(resolve, 100));

        const logs = await Log.find();
        expect(logs).toHaveLength(1);
        expect(logs[0].message).toBe('Experiment Completed with result: Success');
    });
});
