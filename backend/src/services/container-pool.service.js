const Docker = require('dockerode');
const { v4: uuidv4 } = require('uuid');
const Container = require('../domain/container');

class ContainerPoolManager {
    constructor() {
        this.docker = new Docker();
        this.pool = [];
        this.poolSize = process.env.CONTAINER_POOL_SIZE ? parseInt(process.env.CONTAINER_POOL_SIZE) : 2;
        this.image = 'python:3.9-slim'; // Standard image for now
        this.isInitializing = false;
    }

    /**
     * Singleton instance accessor
     */
    static getInstance() {
        if (!ContainerPoolManager.instance) {
            ContainerPoolManager.instance = new ContainerPoolManager();
        }
        return ContainerPoolManager.instance;
    }

    /**
     * Initialize the pool by pre-warming containers.
     */
    async initialize() {
        if (this.isInitializing) return;
        this.isInitializing = true;

        console.log(`Initializing Container Pool (Target Size: ${this.poolSize})...`);
        try {
            await this._ensureImage();
            await this._replenish();
        } catch (error) {
            console.error('Failed to initialize container pool:', error);
        } finally {
            this.isInitializing = false;
        }
    }

    /**
     * Acquire a container from the pool.
     * Triggers asynchronous replenishment.
     * @returns {Promise<Container>}
     */
    async acquire() {
        let container = this.pool.shift();

        if (!container) {
            console.warn('Container pool exhausted, creating new container on-demand...');
            container = await this._createContainer();
        }

        // Replenish asynchronously
        this._replenish().catch(err => console.error('Failed to replenish pool:', err));

        return container;
    }

    /**
     * Internal method to fill the pool up to poolSize.
     */
    async _replenish() {
        while (this.pool.length < this.poolSize) {
            try {
                const container = await this._createContainer();
                this.pool.push(container);
            } catch (err) {
                console.error('Error repleneshing container:', err);
                break; // Stop trying if we hit errors (e.g. docker daemon down)
            }
        }
    }

    /**
     * Creates a single new container with security restrictions.
     * @returns {Promise<Container>}
     */
    async _createContainer() {
        const id = uuidv4();
        const dockerContainer = await this.docker.createContainer({
            Image: this.image,
            Cmd: ['/bin/sh'], // Keep it alive
            Tty: true,       // Keep it alive
            OpenStdin: true, // Keep it alive
            HostConfig: {
                NetworkMode: 'none', // No network access by default for security
                Memory: 128 * 1024 * 1024, // 128MB limit
                // PidsLimit: 10, // Prevent fork bombs
            }
        });

        await dockerContainer.start();

        return new Container(id, dockerContainer);
    }

    /**
     * Ensures the base image exists locally.
     */
    async _ensureImage() {
        try {
            await this.docker.getImage(this.image).inspect();
        } catch (err) {
            if (err.statusCode === 404) {
                console.log(`Pulling image ${this.image}...`);
                await new Promise((resolve, reject) => {
                    this.docker.pull(this.image, (err, stream) => {
                        if (err) return reject(err);
                        this.docker.modem.followProgress(stream, onFinished, onProgress);

                        function onFinished(err, output) {
                            if (err) reject(err);
                            else resolve(output);
                        }
                        function onProgress(event) {
                            // console.log(event);
                        }
                    });
                });
                console.log(`Image ${this.image} pulled.`);
            } else {
                throw err;
            }
        }
    }

    /**
     * Clean up all containers in the pool.
     */
    async shutdown() {
        console.log('Shutting down container pool...');
        // Destroy all pooled containers
        await Promise.all(this.pool.map(c => c.destroy()));
        this.pool = [];
    }
}

module.exports = ContainerPoolManager;
