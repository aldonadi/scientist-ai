const Docker = require('dockerode');
const { Container } = require('./container');

// Only run if Docker is available
const docker = new Docker();

describe('Container Integration', () => {
    let containerId;
    let wrapper;

    // Check if we can talk to docker
    let dockerAvailable = false;
    beforeAll(async () => {
        try {
            await docker.ping();
            dockerAvailable = true;
        } catch (e) {
            console.warn('Docker not available, skipping integration tests');
        }
    });

    beforeEach(async () => {
        if (!dockerAvailable) return;

        // Start a fresh container for each test
        const container = await docker.createContainer({
            Image: 'python:3.9-slim',
            Cmd: ['tail', '-f', '/dev/null'], // Keep it running
            Tty: false
        });
        await container.start();
        containerId = container.id;
        wrapper = new Container(docker, containerId);
    });

    afterEach(async () => {
        if (!dockerAvailable || !wrapper) return;
        try {
            await wrapper.destroy();
        } catch (e) {
            console.error('Cleanup failed', e);
        }
    });

    test('should execute hello world', async () => {
        if (!dockerAvailable) return;

        const result = await wrapper.execute('print("Hello World")');
        expect(result.stdout).toBe('Hello World');
        expect(result.exitCode).toBe(0);
    }, 20000);

    test('should pass arguments', async () => {
        if (!dockerAvailable) return;

        const script = 'import sys\nprint(sys.argv[1])';
        const result = await wrapper.execute(script, {}, ['TestArg']);
        expect(result.stdout).toBe('TestArg');
    }, 20000);

    test('should inject environment variables', async () => {
        if (!dockerAvailable) return;

        const script = 'import os\nprint(os.environ.get("MY_VAR"))';
        const result = await wrapper.execute(script, { MY_VAR: 'Integration' });
        expect(result.stdout).toBe('Integration');
    }, 20000);

    test('should capture stderr on error', async () => {
        if (!dockerAvailable) return;

        const script = 'import sys\nprint("Error", file=sys.stderr)\nsys.exit(1)';
        const result = await wrapper.execute(script);
        expect(result.stderr).toBe('Error');
        expect(result.exitCode).toBe(1);
    }, 20000);
});
