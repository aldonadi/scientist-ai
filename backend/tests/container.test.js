const Container = require('../src/domain/container');
const { PassThrough } = require('stream');

// Mock Dockerode
jest.mock('dockerode');

describe('Container Wrapper', () => {
    let mockDockerContainer;
    let containerWrapper;

    beforeEach(() => {
        // Setup Mocks
        const execMock = {
            start: jest.fn(),
            inspect: jest.fn().mockResolvedValue({ ExitCode: 0 })
        };

        mockDockerContainer = {
            exec: jest.fn().mockResolvedValue(execMock),
            remove: jest.fn().mockResolvedValue(),
            modem: {
                demuxStream: jest.fn((stream, stdout, stderr) => {
                    // Simulate execution output
                    // Check if we are running the python script test or ls test
                    // But we don't have easy access to the Cmd here inside the callback easily
                    // unless we make the mock smarter or change the test setup.
                    // Simplified: The 'ls' test expects 'file.txt', the 'python' test expects 'hello'.
                    // Let's just default to 'file.txt' if not 'hello' logic? 
                    // No, let's change the test setups to override the mock implementation per test.
                    stdout.write('hello');
                    stdout.end();
                    stderr.end();
                })
            }
        };

        containerWrapper = new Container('test-id', mockDockerContainer);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should initialize correctly', () => {
        expect(containerWrapper.id).toBe('test-id');
        expect(containerWrapper.status).toBe('READY');
        expect(containerWrapper.dockerContainer).toBe(mockDockerContainer);
    });

    describe('execute() (Python Script)', () => {
        test('should run script and return output', async () => {
            const mockStream = new PassThrough();
            const execMock = await mockDockerContainer.exec();

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
            expect(mockDockerContainer.exec).toHaveBeenCalledWith(expect.objectContaining({
                Cmd: expect.arrayContaining(['python3', '-']),
                AttachStdin: true
            }));
        });
    });

    describe('executeCommand() (Raw Command)', () => {
        test('should run raw command and return output', async () => {
            const mockStream = new PassThrough();
            const execMock = await mockDockerContainer.exec({ Cmd: ['ls'] });
            execMock.start.mockResolvedValue(mockStream);

            // Override demux to emit 'file.txt'
            mockDockerContainer.modem.demuxStream = jest.fn((stream, stdout, stderr) => {
                stdout.write('file.txt');
                stdout.end();
                stderr.end();
            });

            const executePromise = containerWrapper.executeCommand(['ls']);

            setTimeout(() => {
                mockStream.emit('data', Buffer.from('file.txt'));
                mockStream.emit('end');
            }, 10);

            const result = await executePromise;
            expect(result.stdout).toBe('file.txt');
            expect(mockDockerContainer.exec).toHaveBeenCalledWith(expect.objectContaining({
                Cmd: ['ls'],
                AttachStdout: true
            }));
        });
    });

    test('destroy should remove container', async () => {
        await containerWrapper.destroy();
        expect(mockDockerContainer.remove).toHaveBeenCalledWith({ force: true });
        expect(containerWrapper.status).toBe('TERMINATED');
    });

    test('destroy should ignore 404', async () => {
        const err = new Error('Not Found');
        err.statusCode = 404;
        mockDockerContainer.remove.mockRejectedValue(err);

        await containerWrapper.destroy();
        expect(containerWrapper.status).toBe('TERMINATED');
    });
});
