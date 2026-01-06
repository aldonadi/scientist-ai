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
     * Executes a command inside the container.
     * @param {string[]} cmd - Command to execute (e.g. ['python', '-c', 'print("hello")'])
     * @param {Object} [opts] - Execution options
     * @returns {Promise<{stdout: string, stderr: string, exitCode: number}>}
     */
    async execute(cmd, opts = {}) {
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

            // Dockerode streams are multiplexed (stdout and stderr together)
            // We need to demultiplex them if we want separate streams, 
            // but for simplicity here we might just capture output.
            // docker-modem/lib/modem.js demuxStream might be needed if we want clean separation.
            // For now, let's just collect the stream output. 
            // NOTE: dockerode exec start returns a stream. 

            return new Promise((resolve, reject) => {
                let output = '';
                let errorOutput = '';

                // Simple demux check based on docker protocol is a bit complex to implement from scratch.
                // Usually dockerode provides a way.
                // Let's use the 'demuxStream' method from the docker container object if available, 
                // or just accept mixed output for this initial version if acceptable.
                // Better: Use `dockerContainer.modem.demuxStream(stream, stdoutStream, stderrStream)`

                const stdoutStream = new (require('stream').PassThrough)();
                const stderrStream = new (require('stream').PassThrough)();

                this.dockerContainer.modem.demuxStream(stream, stdoutStream, stderrStream);

                stdoutStream.on('data', chunk => output += chunk.toString());
                stderrStream.on('data', chunk => errorOutput += chunk.toString());

                stream.on('end', async () => {
                    const inspect = await exec.inspect();
                    resolve({
                        stdout: output,
                        stderr: errorOutput,
                        exitCode: inspect.ExitCode
                    });
                });

                stream.on('error', reject);
            });

        } catch (err) {
            throw err;
        } finally {
            // We don't set back to READY because containers are one-shot usually, 
            // but if we reuse them, we would.
            // For the pool 'one-shot' policy, this container is now dirty.
            // The pool manager handles lifecycle, but internally we can flag it.
        }
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
                console.error(`Failed to destroy container ${this.id}:`, err);
                throw err;
            }
        }
    }
}

module.exports = Container;
