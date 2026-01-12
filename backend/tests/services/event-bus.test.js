const { EventBus, EventTypes } = require('../../src/services/event-bus');

describe('EventBus System', () => {
    let bus;

    beforeEach(() => {
        bus = new EventBus();
    });

    test('should instantiate correctly', () => {
        expect(bus).toBeDefined();
        expect(bus).toBeInstanceOf(EventBus);
    });

    test('should emit and receive events', (done) => {
        const payload = { test: 'data' };

        bus.on(EventTypes.EXPERIMENT_START, (data) => {
            try {
                expect(data).toEqual(payload);
                done();
            } catch (error) {
                done(error);
            }
        });

        bus.emit(EventTypes.EXPERIMENT_START, payload);
    });

    test('should handle multiple subscribers', () => {
        const callback1 = jest.fn();
        const callback2 = jest.fn();
        const payload = { id: 123 };

        bus.on(EventTypes.EXTERIMENT_END, callback1);
        bus.on(EventTypes.EXTERIMENT_END, callback2);

        // Note: Typo handling check - if I emit a custom event or the correct one.
        // Let's use a standard one for this test
        bus.on(EventTypes.LOG, callback1);
        bus.on(EventTypes.LOG, callback2);

        bus.emit(EventTypes.LOG, payload);

        expect(callback1).toHaveBeenCalledWith(payload);
        expect(callback2).toHaveBeenCalledWith(payload);
    });

    test('should define all required event types', () => {
        const expectedEvents = [
            'EXPERIMENT_START',
            'STEP_START',
            'ROLE_START',
            'MODEL_PROMPT',
            'MODEL_RESPONSE_CHUNK',
            'MODEL_RESPONSE_COMPLETE',
            'TOOL_CALL',
            'TOOL_RESULT',
            'STEP_END',
            'EXPERIMENT_END',
            'LOG'
        ];

        expectedEvents.forEach(event => {
            expect(EventTypes[event]).toBeDefined();
            expect(EventTypes[event]).toBe(event);
        });
    });

    test('should decouple listeners', () => {
        const callback = jest.fn();
        bus.on(EventTypes.STEP_START, callback);

        bus.emit(EventTypes.STEP_START, { step: 1 });
        bus.off(EventTypes.STEP_START, callback);
        bus.emit(EventTypes.STEP_START, { step: 2 });

        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenCalledWith({ step: 1 });
    });
});
