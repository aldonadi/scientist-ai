const { EventTypes } = require('./event-bus');
const Log = require('../models/log.model');

class Logger {
    /**
     * @param {import('./event-bus').EventBus} eventBus
     */
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.subscribe();
    }

    subscribe() {
        // Explicit Log Event
        this.eventBus.on(EventTypes.LOG, (payload) => this.handleLog(payload));

        // Lifecycle Events
        this.eventBus.on(EventTypes.EXPERIMENT_START, (payload) => this.handleExperimentStart(payload));
        this.eventBus.on(EventTypes.STEP_START, (payload) => this.handleStepStart(payload));
        this.eventBus.on(EventTypes.EXPERIMENT_END, (payload) => this.handleExperimentEnd(payload));
        // Add more lifecycle events as needed based on requirements
    }

    /**
     * Handles explicit LOG events
     * @param {Object} payload 
     * @param {string} payload.experimentId
     * @param {number} payload.stepNumber
     * @param {string} payload.source
     * @param {string} payload.message
     * @param {Object} [payload.data]
     */
    async handleLog(payload) {
        try {
            await Log.create({
                experimentId: payload.experimentId,
                stepNumber: payload.stepNumber,
                source: payload.source,
                message: payload.message,
                data: payload.data
            });
        } catch (error) {
            console.error('Failed to write log to DB:', error);
        }
    }

    async handleExperimentStart({ experimentId, planName }) {
        await this.handleLog({
            experimentId,
            stepNumber: 0,
            source: 'System',
            message: `Experiment Initialized from plan: ${planName}`
        });
    }

    async handleStepStart({ experimentId, stepNumber }) {
        await this.handleLog({
            experimentId,
            stepNumber,
            source: 'System',
            message: `Step ${stepNumber} Started`
        });
    }

    async handleExperimentEnd({ experimentId, result }) {
        // We might not have stepNumber easily available here unless passed, 
        // but usually Experiment End happens after the last step.
        // For now, we'll default to 0 or check if payload has it. 
        // Ideally, the event payload should have it or we query the experiment (expensive).
        // Let's assume passed or 0 for now.

        await this.handleLog({
            experimentId,
            stepNumber: 0, // Or potential last step if available
            source: 'System',
            message: `Experiment Completed with result: ${result}`
        });
    }
}

module.exports = Logger;
