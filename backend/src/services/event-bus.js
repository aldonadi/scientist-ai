const EventEmitter = require('events');

/**
 * Standard Event Types for the Scientist.ai system.
 */
const EventTypes = {
    EXPERIMENT_START: 'EXPERIMENT_START',
    STEP_START: 'STEP_START',
    ROLE_START: 'ROLE_START', // { roleName }
    MODEL_PROMPT: 'MODEL_PROMPT', // { roleName, messages }
    MODEL_RESPONSE_CHUNK: 'MODEL_RESPONSE_CHUNK', // { roleName, chunk }
    MODEL_RESPONSE_COMPLETE: 'MODEL_RESPONSE_COMPLETE', // { roleName, fullResponse }
    TOOL_CALL: 'TOOL_CALL', // { toolName, args }
    TOOL_RESULT: 'TOOL_RESULT', // { toolName, result, envChanges }
    STEP_END: 'STEP_END', // { stepNumber, environmentSnapshot }
    EXPERIMENT_END: 'EXPERIMENT_END', // { result, duration }
    LOG: 'LOG', // { source, level, message, data }
    BEFORE_TOOL_CALL: 'BEFORE_TOOL_CALL', // { toolName, args }
    AFTER_TOOL_CALL: 'AFTER_TOOL_CALL', // { toolName, result }
};

/**
 * Central Event Bus for decoupling execution logic from side effects.
 * Extends Node.js EventEmitter.
 */
class EventBus extends EventEmitter {
    constructor() {
        super();
    }

    /**
     * Emit an event with a payload.
     * Wrapper around standard emit for potential future enhancements (logging, async, etc).
     * @param {string} type - Event type from EventTypes
     * @param {object} payload - Data associated with the event
     */
    emit(type, payload) {
        return super.emit(type, payload);
    }
}

module.exports = {
    EventBus,
    EventTypes
};
