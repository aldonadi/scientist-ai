const ContainerPoolManager = require('../src/services/container-pool.service');
const Docker = require('dockerode');
const Container = require('../src/domain/container');

// Mock Dockerode
jest.mock('dockerode');

describe('ContainerPoolManager', () => {
    let containerPoolManager;
    let mockDocker;
    let mockDockerContainer;

    beforeEach(() => {
        // Reset singleton for testing
        ContainerPoolManager.instance = null;

        // Setup Mocks
        mockDockerContainer = {
            start: jest.fn().mockResolvedValue(),
            inspect: jest.fn().mockResolvedValue({ State: { Running: true } }),
            remove: jest.fn().mockResolvedValue(),
            id: 'mock-container-id'
        };

        mockDocker = {
            createContainer: jest.fn().mockResolvedValue(mockDockerContainer),
            getImage: jest.fn().mockReturnValue({
                inspect: jest.fn().mockResolvedValue({}) // Image exists
            }),
            pull: jest.fn()
        };

        Docker.mockImplementation(() => mockDocker);

        // Initialize Manager
        containerPoolManager = new ContainerPoolManager();
        // Override pool size for testing
        containerPoolManager.poolSize = 2;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should be a singleton', () => {
        const instance1 = ContainerPoolManager.getInstance();
        const instance2 = ContainerPoolManager.getInstance();
        expect(instance1).toBe(instance2);
    });

    describe('initialize()', () => {
        test('should pre-warm the pool', async () => {
            await containerPoolManager.initialize();

            expect(mockDocker.createContainer).toHaveBeenCalledTimes(2);
            expect(containerPoolManager.pool.length).toBe(2);
            expect(mockDockerContainer.start).toHaveBeenCalledTimes(2);
        });
    });

    describe('acquire()', () => {
        test('should return a container and trigger replenishment', async () => {
            await containerPoolManager.initialize();
            expect(containerPoolManager.pool.length).toBe(2);

            const container = await containerPoolManager.acquire();

            expect(container).toBeInstanceOf(Container);
            expect(containerPoolManager.pool.length).toBe(1); // Immediate state

            // Helper to wait for async replenishment
            await new Promise(resolve => setTimeout(resolve, 10));

            expect(containerPoolManager.pool.length).toBe(2); // Replenished
            // Initial 2 + 1 replenishment
            expect(mockDocker.createContainer).toHaveBeenCalledTimes(3);
        });

        test('should create on-demand if pool is empty', async () => {
            // No init
            expect(containerPoolManager.pool.length).toBe(0);

            const container = await containerPoolManager.acquire();

            expect(container).toBeInstanceOf(Container);
            // It must be called at least once (for the on-demand container).
            // Replenishment might trigger more calls asynchronously, causing flakiness if we check strict equality.
            expect(mockDocker.createContainer.mock.calls.length).toBeGreaterThanOrEqual(1);
        });
    });

    describe('_createContainer security limits', () => {
        test('should apply default security limits', async () => {
            await containerPoolManager._createContainer();

            const createCall = mockDocker.createContainer.mock.calls[0][0];
            const hostConfig = createCall.HostConfig;

            expect(hostConfig.NetworkMode).toBe('none');
            expect(hostConfig.Memory).toBe(128 * 1024 * 1024);
            expect(hostConfig.PidsLimit).toBe(50); // Default
            expect(hostConfig.CpuQuota).toBe(50000); // Default
            expect(hostConfig.CpuPeriod).toBe(100000);
        });

        test('should apply configured security limits', async () => {
            process.env.CONTAINER_PIDS_LIMIT = '20';
            process.env.CONTAINER_CPU_QUOTA = '25000';

            await containerPoolManager._createContainer();

            // beforeEach resets mocks, so this is the first call in this test
            const createCall = mockDocker.createContainer.mock.calls[0][0];
            const hostConfig = createCall.HostConfig;

            expect(hostConfig.PidsLimit).toBe(20);
            expect(hostConfig.CpuQuota).toBe(25000);

            // Cleanup env
            delete process.env.CONTAINER_PIDS_LIMIT;
            delete process.env.CONTAINER_CPU_QUOTA;
        });
    });

    describe('shutdown()', () => {
        test('should destroy all containers', async () => {
            await containerPoolManager.initialize();
            const containers_copy = [...containerPoolManager.pool];

            // Mock destroy on the Container instances
            containers_copy.forEach(c => c.destroy = jest.fn());

            await containerPoolManager.shutdown();

            expect(containerPoolManager.pool.length).toBe(0);
            containers_copy.forEach(c => expect(c.destroy).toHaveBeenCalled());
        });
    });
});
