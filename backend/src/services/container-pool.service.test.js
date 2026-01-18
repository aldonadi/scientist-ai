const ContainerPoolManager = require('./container-pool.service');
const Docker = require('dockerode');
const Container = require('../domain/container');

// Mock dockerode
jest.mock('dockerode');

describe('ContainerPoolManager', () => {
    let poolManager;
    let mockDocker;
    let mockContainer;

    beforeEach(() => {
        // Reset singleton
        ContainerPoolManager.instance = null;

        // Setup mock container
        mockContainer = {
            start: jest.fn().mockResolvedValue(),
            inspect: jest.fn().mockResolvedValue({ State: { Running: true } }),
            remove: jest.fn().mockResolvedValue(),
            exec: jest.fn().mockResolvedValue({
                start: jest.fn().mockResolvedValue({
                    on: jest.fn(),
                }),
                inspect: jest.fn().mockResolvedValue({ ExitCode: 0 })
            })
        };
        mockContainer.modem = {
            demuxStream: jest.fn()
        };

        // Setup mock docker instance
        mockDocker = {
            createContainer: jest.fn().mockResolvedValue(mockContainer),
            getImage: jest.fn().mockReturnValue({
                inspect: jest.fn().mockResolvedValue({}) // Image exists
            }),
            pull: jest.fn()
        };
        Docker.mockImplementation(() => mockDocker);

        poolManager = ContainerPoolManager.getInstance();
        // Override pool size for faster tests
        poolManager.poolSize = 2;
    });

    afterEach(async () => {
        await poolManager.shutdown();
        jest.clearAllMocks();
    });

    describe('initialize', () => {
        it('should pre-warm the pool to the configured size', async () => {
            // Mock createContainer to return a new object each time so we can track calls
            mockDocker.createContainer.mockResolvedValue({ ...mockContainer });

            await poolManager.initialize();

            expect(mockDocker.createContainer).toHaveBeenCalledTimes(2);
            expect(poolManager.pool.length).toBe(2);
            expect(poolManager.pool[0]).toBeInstanceOf(Container);
        });

        it('should pull image if not present', async () => {
            mockDocker.getImage.mockReturnValue({
                inspect: jest.fn().mockRejectedValue({ statusCode: 404 })
            });
            mockDocker.pull.mockImplementation((name, cb) => {
                cb(null, { on: (evt, handler) => handler() }); // Simulate stream end
            });
            // Need to mock modem.followProgress as well since it's used in _ensureImage
            mockDocker.modem = {
                followProgress: (stream, onFinished) => onFinished(null, "output")
            };

            await poolManager.initialize();

            expect(mockDocker.pull).toHaveBeenCalledWith('python:3.9-slim', expect.any(Function));
        });
    });

    describe('acquire', () => {
        beforeEach(async () => {
            await poolManager.initialize();
            mockDocker.createContainer.mockClear(); // Clear initialization calls
        });

        it('should return a container from the pool immediately', async () => {
            const container = await poolManager.acquire();
            expect(container).toBeDefined();
            expect(poolManager.pool.length).toBe(1); // One taken
        });

        it('should trigger replenishment asynchronously', async () => {
            await poolManager.acquire();

            // Wait a tick for async replenishment
            await new Promise(resolve => setTimeout(resolve, 10));

            expect(mockDocker.createContainer).toHaveBeenCalled();
            expect(poolManager.pool.length).toBe(2); // Should be back to full
        });

        it('should create a container on-demand if pool is empty', async () => {
            // Drain pool
            poolManager.pool = [];

            const container = await poolManager.acquire();

            expect(mockDocker.createContainer).toHaveBeenCalled();
            expect(container).toBeDefined();
        });
    });

    describe('shutdown', () => {
        it('should destroy all containers in the pool', async () => {
            await poolManager.initialize();
            const containers = [...poolManager.pool];

            await poolManager.shutdown();

            expect(containers[0].dockerContainer.remove).toHaveBeenCalled();
            expect(containers[1].dockerContainer.remove).toHaveBeenCalled();
            expect(poolManager.pool.length).toBe(0);
        });
    });
});
