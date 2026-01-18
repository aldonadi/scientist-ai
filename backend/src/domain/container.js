const { PassThrough } = require('stream');

/**
 * Wrapper around a Docker container instance.
 */
class Container {
    /**
     * @param {string} id - Docker container ID
     * @param {import('dockerode').Container} dockerContainer - Dockerode container instance
     */
    constructor(id, dockerContainer) {
        this.id = id;
        this.dockerContainer = dockerContainer;
        this.status = 'READY'; // INITIALIZING, READY, BUSY, TERMINATED
        this.expiry = null;
    }

    /**
     * Executes a raw command inside the container.
     * @param {string[]} cmd - Command to execute (e.g. ['python', '-c', 'print("hello")'])
     * @param {Object} [opts] - Execution options
     * @returns {Promise<{stdout: string, stderr: string, exitCode: number}>}
     */
    async executeCommand(cmd, opts = {}) {
        if (this.status === 'TERMINATED') {
            throw new Error('Cannot execute on a terminated container');
        }

        this.status = 'BUSY';
        try {
            const exec = await this.dockerContainer.exec({
                Cmd: cmd,
                AttachStdout: true,
                AttachStderr: true,
                ...opts
            });

            const stream = await exec.start();

            // Simple output collection for executeCommand
            // For more robust handling use execute() which handles demux properly
            return new Promise((resolve, reject) => {
                let output = '';
                let errorOutput = '';

                // Try to demux if modem is available, else just capture stream
                if (this.dockerContainer.modem && typeof this.dockerContainer.modem.demuxStream === 'function') {
                    const stdoutStream = new PassThrough();
                    const stderrStream = new PassThrough();
                    this.dockerContainer.modem.demuxStream(stream, stdoutStream, stderrStream);

                    stdoutStream.on('data', chunk => output += chunk.toString());
                    stderrStream.on('data', chunk => errorOutput += chunk.toString());
                } else {
                    stream.on('data', chunk => output += chunk.toString());
                }

                stream.on('end', async () => {
                    try {
                        const inspect = await exec.inspect();
                        resolve({
                            stdout: output,
                            stderr: errorOutput,
                            exitCode: inspect.ExitCode
                        });
                    } catch (e) {
                        reject(e);
                    }
                });

                stream.on('error', reject);
            });

        } catch (err) {
            throw err;
        }
    }

    /**
     * Execute a python script in the container.
     * Uses robust stdin injection and proper environment formatting.
     * 
     * @param {string} script - Python source code
     * @param {object} env - Environment variables map
     * @param {string[]} args - Arguments for the script
     * @returns {Promise<{stdout: string, stderr: string, exitCode: number, duration: number}>}
     */
    async execute(script, env = {}, args = []) {
        if (this.status === 'TERMINATED') {
            throw new Error('Cannot execute on a terminated container');
        }

        // If we want strict state checking:
        // if (this.status !== 'READY') throw new Error(...)

        this.status = 'BUSY';
        const startTime = Date.now();

        try {
            // Prepare env array ["KEY=VAL", ...]
            const Env = Object.entries(env).map(([k, v]) => `${k}=${v}`);

            // Prepare command: python3 - [args]
            // We use '-' to tell python to read from stdin
            const cmd = ['python3', '-', ...args];

            const exec = await this.dockerContainer.exec({
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
            // Check if modem exists (it should on a real container object)
            if (this.dockerContainer.modem) {
                this.dockerContainer.modem.demuxStream(stream, stdoutStream, stderrStream);
            }

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
            throw error;
        }
        // NOTE: We do not reset status to READY here automatically 
        // because the ContainerPoolManager handles lifecycle (destroy vs reuse).
    }

    /**
     * Force kills and removes the container.
     */
    async destroy() {
        this.status = 'TERMINATED';
        try {
            // Force removal (kill then remove)
            await this.dockerContainer.remove({ force: true });
        } catch (err) {
            // Ignore 404 (already gone)
            if (err.statusCode !== 404) {
                // Check if it's just a "No such container" error which is 404 effectively
                if (err.statusCode) {
                    console.error(`Failed to destroy container ${this.id}:`, err);
                    throw err;
                }
            }
        }
    }
}

module.exports = Container;
