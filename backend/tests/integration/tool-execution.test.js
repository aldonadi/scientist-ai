const ContainerPoolManager = require('../../src/services/container-pool.service');
const { Container } = require('../../src/domain/container'); // Import from domain

// We are testing standard docker execution, so we might need a real docker daemon or mocks.
// For integration tests in this environment, we usually want to test the FLOW.
// If we can't spin up real docker containers here, we might need to rely on the unit tests 
// or high-level mocks. 
// However, the prompt implies "Integration Tests" might use real resources or at least 
// test the interaction between services.
// Given previous context, we likely can't rely on a running docker daemon in this specific 
// agent environment unless stated. 
// BUT, `backend/src/execution/container.test.js` used mocks. 
// I will write this test to mock Dockerode but test the interaction between Pool and Container.

jest.mock('dockerode');
const Docker = require('dockerode');

describe('Tool Execution Integration Flow', () => {
    let poolManager;
    let mockDocker;
    let mockContainer;

    beforeEach(async () => {
        // Setup complex mocks for Dockerode
        const { PassThrough } = require('stream');
        const mockStream = new PassThrough();

        const execMock = {
            start: jest.fn().mockResolvedValue(mockStream),
            inspect: jest.fn().mockResolvedValue({ ExitCode: 0 })
        };

        mockContainer = {
            exec: jest.fn().mockResolvedValue(execMock),
            remove: jest.fn().mockResolvedValue(),
            start: jest.fn().mockResolvedValue(),
            modem: {
                demuxStream: jest.fn((stream, stdout, stderr) => {
                    stdout.write('{"result": "success"}');
                    stdout.end();
                    stderr.end();
                })
            }
        };

        mockDocker = {
            createContainer: jest.fn().mockResolvedValue(mockContainer),
            getImage: jest.fn().mockReturnValue({ inspect: jest.fn().mockResolvedValue({}) }),
            pull: jest.fn()
        };

        // Inject mock into Docker constructor
        Docker.mockImplementation(() => mockDocker);

        poolManager = ContainerPoolManager.getInstance();
        // Reset pool for test
        poolManager.pool = [];
        poolManager.isInitializing = false;
    });

    afterEach(async () => {
        await poolManager.shutdown();
        jest.clearAllMocks();
    });

    test('Full Flow: Acquire -> Execute Tool -> Destroy', async () => {
        // 1. Initialize Pool
        await poolManager.initialize();
        // Since initialize is async and might replenish, we wait a bit or mock _createContainer behavior
        // The mock createContainer is instant, so we should have containers.

        // 2. Acquire
        const container = await poolManager.acquire();
        expect(container).toBeDefined();
        expect(container.id).toBeDefined();

        // 3. Execute Tool (Python Script)
        const toolCode = 'import json; print(json.dumps({"result": "success"}))';
        const execResult = await container.execute(toolCode, { ENV_VAR: 'test' }, []);

        expect(execResult.stdout).toContain('success');
        expect(execResult.exitCode).toBe(0);

        // Verify correct calls were made to Docker
        expect(mockContainer.exec).toHaveBeenCalledWith(expect.objectContaining({
            Cmd: expect.arrayContaining(['python3', '-']),
            Env: expect.arrayContaining(['ENV_VAR=test'])
        }));

        // 4. Destroy
        await container.destroy();
        expect(mockContainer.remove).toHaveBeenCalled();
    });
});
