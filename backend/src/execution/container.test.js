const { Container, CONTAINER_STATUS } = require('./container');
const { PassThrough } = require('stream');

// Mock Dockerode
jest.mock('dockerode');

describe('Container Wrapper', () => {
    let mockDocker;
    let mockContainer;
    let containerWrapper;

    beforeEach(() => {
        // Setup Mocks
        const execMock = {
            start: jest.fn(),
            inspect: jest.fn().mockResolvedValue({ ExitCode: 0 })
        };

        mockContainer = {
            exec: jest.fn().mockResolvedValue(execMock),
            remove: jest.fn().mockResolvedValue(),
            modem: {
                demuxStream: jest.fn((stream, stdout, stderr) => {
                    // Simulate execution output
                    stdout.write('hello');
                    stdout.end();
                    stderr.end();
                })
            }
        };

        mockDocker = {
            getContainer: jest.fn().mockReturnValue(mockContainer)
        };

        containerWrapper = new Container(mockDocker, 'test-id');
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should initialize correctly', () => {
        expect(containerWrapper.id).toBe('test-id');
        expect(containerWrapper.status).toBe(CONTAINER_STATUS.READY);
        expect(mockDocker.getContainer).toHaveBeenCalledWith('test-id');
    });

    test('execute should run script and return output', async () => {
        const mockStream = new PassThrough();
        const execMock = await mockContainer.exec();

        execMock.start.mockResolvedValue(mockStream);

        const script = 'print("hello")';
        const executePromise = containerWrapper.execute(script);

        // Simulate stream flow
        setTimeout(() => {
            mockStream.emit('data', Buffer.from('hello'));
            mockStream.emit('end');
        }, 10);

        const result = await executePromise;

        expect(result.stdout).toBe('hello');
        expect(result.exitCode).toBe(0);
        expect(mockContainer.exec).toHaveBeenCalledWith(expect.objectContaining({
            Cmd: ['python3', '-',],
            AttachStdin: true
        }));
    });

    test('execute should throw if container is not READY', async () => {
        containerWrapper.status = CONTAINER_STATUS.BUSY;
        await expect(containerWrapper.execute('print("hi")'))
            .rejects.toThrow('Container is not READY');
    });

    test('destroy should remove container', async () => {
        await containerWrapper.destroy();
        expect(mockContainer.remove).toHaveBeenCalledWith({ force: true });
        expect(containerWrapper.status).toBe(CONTAINER_STATUS.TERMINATED);
    });

    test('destroy should ignore 404', async () => {
        const err = new Error('Not Found');
        err.statusCode = 404;
        mockContainer.remove.mockRejectedValue(err);

        await containerWrapper.destroy();
        expect(containerWrapper.status).toBe(CONTAINER_STATUS.TERMINATED);
    });

    test('destroy should throw other errors', async () => {
        const err = new Error('Server Error');
        err.statusCode = 500;
        mockContainer.remove.mockRejectedValue(err);

        await expect(containerWrapper.destroy()).rejects.toThrow('Server Error');
    });
});
