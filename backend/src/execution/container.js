const Docker = require('dockerode');
const { PassThrough } = require('stream');

const CONTAINER_STATUS = {
    STARTING: 'STARTING',
    READY: 'READY',
    BUSY: 'BUSY',
    TERMINATED: 'TERMINATED'
};

class Container {
    /**
     * @param {Docker} dockerClient - Instance of Dockerode
     * @param {string} id - Docker Container ID
     */
    constructor(dockerClient, id) {
        if (!dockerClient) throw new Error('Docker client is required');
        if (!id) throw new Error('Container ID is required');

        this.docker = dockerClient;
        this.id = id;
        this.status = CONTAINER_STATUS.READY;
        this.expiry = null;
        this.container = this.docker.getContainer(id);
    }

    /**
     * Execute a python script in the container
     * @param {string} script - Python source code
     * @param {object} env - Environment variables map
     * @param {string[]} args - Arguments for the script
     * @returns {Promise<{stdout: string, stderr: string, exitCode: number, duration: number}>}
     */
    async execute(script, env = {}, args = []) {
        if (this.status !== CONTAINER_STATUS.READY) {
            throw new Error(`Container is not READY. Current status: ${this.status}`);
        }

        this.status = CONTAINER_STATUS.BUSY;
        const startTime = Date.now();

        try {
            // Prepare env array ["KEY=VAL", ...]
            const Env = Object.entries(env).map(([k, v]) => `${k}=${v}`);

            // Prepare command: python3 - [args]
            // We use '-' to tell python to read from stdin
            const cmd = ['python3', '-', ...args];

            const exec = await this.container.exec({
                Cmd: cmd,
                Env: Env,
                AttachStdin: true,
                AttachStdout: true,
                AttachStderr: true,
            });

            // Start execution with hijack to get duplex stream
            const stream = await exec.start({
                hijack: true,
                stdin: true
            });

            // setup output collection
            const stdoutStream = new PassThrough();
            const stderrStream = new PassThrough();

            // demultiplex docker stream
            this.container.modem.demuxStream(stream, stdoutStream, stderrStream);

            // FIX: docker-modem sometimes fails to end substreams when main stream ends
            stream.on('end', () => {
                stdoutStream.end();
                stderrStream.end();
            });

            const stdoutPromise = new Promise((resolve) => {
                let data = [];
                stdoutStream.on('data', chunk => data.push(chunk));
                stdoutStream.on('end', () => resolve(Buffer.concat(data).toString()));
            });

            const stderrPromise = new Promise((resolve) => {
                let data = [];
                stderrStream.on('data', chunk => data.push(chunk));
                stderrStream.on('end', () => resolve(Buffer.concat(data).toString()));
            });

            // Write script to stdin and close it to trigger EOF for python
            stream.write(script);
            stream.end();

            // Wait for streams to finish
            const [stdout, stderr] = await Promise.all([stdoutPromise, stderrPromise]);

            // Inspect to get exit code
            const inspect = await exec.inspect();
            const exitCode = inspect.ExitCode;
            const duration = Date.now() - startTime;

            return {
                stdout: stdout.trim(),
                stderr: stderr.trim(),
                exitCode,
                duration
            };

        } catch (error) {
            // If something goes wrong during setup or execution machinery
            throw error;
        } finally {
            // In a one-shot model, we leave it BUSY until destroyed.
            // If we wanted to reuse, we'd reset to READY. 
            // Given the SPEC calls for "execute-and-destroy", the Orchestrator will call destroy().
            // Leaving it BUSY prevents accidental reuse.
        }
    }

    /**
     * Terminate and remove the container
     */
    async destroy() {
        if (this.status === CONTAINER_STATUS.TERMINATED) return;

        try {
            await this.container.remove({ force: true });
        } catch (err) {
            // Ignore 404 (already removed)
            if (err.statusCode !== 404) throw err;
        } finally {
            this.status = CONTAINER_STATUS.TERMINATED;
        }
    }
}

module.exports = { Container, CONTAINER_STATUS };
