/**
 * Service to manage active experiment orchestrators.
 * Singleton pattern.
 */
class OrchestratorRegistry {
    constructor() {
        if (OrchestratorRegistry.instance) {
            return OrchestratorRegistry.instance;
        }

        this.orchestrators = new Map(); // experimentId -> orchestratorInstance
        OrchestratorRegistry.instance = this;
    }

    /**
     * Get the singleton instance.
     */
    static getInstance() {
        if (!OrchestratorRegistry.instance) {
            new OrchestratorRegistry();
        }
        return OrchestratorRegistry.instance;
    }

    /**
     * Register an active orchestrator.
     * @param {string} experimentId
     * @param {Object} orchestrator
     */
    register(experimentId, orchestrator) {
        // Convert ObjectId to string if needed
        const id = experimentId.toString();
        this.orchestrators.set(id, orchestrator);
    }

    /**
     * Retrieve an active orchestrator.
     * @param {string} experimentId
     * @returns {Object|undefined}
     */
    get(experimentId) {
        const id = experimentId.toString();
        return this.orchestrators.get(id);
    }

    /**
     * Remove an orchestrator from the registry.
     * @param {string} experimentId
     */
    remove(experimentId) {
        const id = experimentId.toString();
        this.orchestrators.delete(id);
    }
}

module.exports = OrchestratorRegistry;
