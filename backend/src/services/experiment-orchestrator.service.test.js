const EventEmitter = require('events');
const { ExperimentOrchestrator } = require('./experiment-orchestrator.service');
const { EventBus, EventTypes } = require('./event-bus');
const { Experiment } = require('../models/experiment.model');
const { ExperimentPlan } = require('../models/experimentPlan.model');

// Mock Dependencies
jest.mock('../models/experiment.model');
jest.mock('../models/experimentPlan.model');
jest.mock('./logger.service'); // We don't test logger side effects here

describe('ExperimentOrchestrator Step Loop', () => {
    let orchestrator;
    let mockExperiment;
    let mockPlan;
    let mockEventBusEmit;

    beforeEach(() => {
        // Reset Mocks
        jest.clearAllMocks();

        // Setup Mock Data
        mockExperiment = {
            _id: 'exp-123',
            planId: 'plan-123',
            status: 'INITIALIZING',
            currentStep: 0,
            currentEnvironment: { variables: {} },
            save: jest.fn().mockResolvedValue(true)
        };

        mockPlan = {
            _id: 'plan-123',
            name: 'Test Plan',
            roles: [
                { name: 'RoleA' },
                { name: 'RoleB' }
            ],
            goals: [],
            maxSteps: 5
        };

        // Setup Methods
        Experiment.findById.mockResolvedValue(mockExperiment);
        ExperimentPlan.findById.mockResolvedValue(mockPlan);

        orchestrator = new ExperimentOrchestrator('exp-123');

        // Spy on EventBus
        mockEventBusEmit = jest.spyOn(orchestrator.eventBus, 'emit');
    });

    /**
     * Helper to wait for loop to likely finish or progress
     * Since runLoop is async and potentially infinite without breaks, 
     * we rely on the mocked state changes or just waiting a tick.
     */
    const tick = () => new Promise(resolve => setImmediate(resolve));

    test('should initialize and start the loop', async () => {
        // Prevent actual loop execution to verify start logic
        jest.spyOn(orchestrator, 'runLoop').mockResolvedValue();

        await orchestrator.start();

        expect(Experiment.findById).toHaveBeenCalledWith('exp-123');
        expect(ExperimentPlan.findById).toHaveBeenCalledWith('plan-123');
        expect(mockEventBusEmit).toHaveBeenCalledWith(EventTypes.EXPERIMENT_START, expect.any(Object));
        expect(mockExperiment.status).toBe('RUNNING');
        expect(mockExperiment.save).toHaveBeenCalled();
    });

    test('should increment steps up to maxSteps and fail', async () => {
        // Reduce maxSteps for quicker test
        mockPlan.maxSteps = 2;

        await orchestrator.start();

        // Should emit START, then STEP 0, STEP 1, then fail on STEP 2 check -> STOP
        // But logic is:
        // Loop while step < max (0 < 2) -> Run Step 0 -> inc to 1 -> check 1 >= 2 (no)
        // Loop while step < max (1 < 2) -> Run Step 1 -> inc to 2 -> check 2 >= 2 (yes) -> FAIL

        // Let's verify calls
        // Initial Start
        expect(mockEventBusEmit).toHaveBeenCalledWith(EventTypes.EXPERIMENT_START, expect.any(Object));

        // Step 0
        expect(mockEventBusEmit).toHaveBeenCalledWith(EventTypes.STEP_START, { experimentId: 'exp-123', stepNumber: 0 });
        expect(mockEventBusEmit).toHaveBeenCalledWith(EventTypes.STEP_END, { experimentId: 'exp-123', stepNumber: 0 });

        // Step 1
        expect(mockEventBusEmit).toHaveBeenCalledWith(EventTypes.STEP_START, { experimentId: 'exp-123', stepNumber: 1 });
        expect(mockEventBusEmit).toHaveBeenCalledWith(EventTypes.STEP_END, { experimentId: 'exp-123', stepNumber: 1 });

        // Termination
        expect(mockEventBusEmit).toHaveBeenCalledWith(EventTypes.EXPERIMENT_END, { experimentId: 'exp-123', result: 'Max Steps Exceeded' });
        expect(mockExperiment.status).toBe('FAILED');
        expect(mockExperiment.result).toBe('Max Steps Exceeded');
    });

    test('should terminate early if a goal is met', async () => {
        mockPlan.maxSteps = 10;
        mockPlan.goals = [
            { description: 'Goal A', conditionScript: 'FALSE' },
            { description: 'Goal B', conditionScript: 'TRUE' } // Special mock trigger
        ];

        await orchestrator.start();

        // Should run Step 0 -> Check Goal -> Met -> Complete
        expect(mockEventBusEmit).toHaveBeenCalledWith(EventTypes.STEP_START, { experimentId: 'exp-123', stepNumber: 0 });
        expect(mockEventBusEmit).toHaveBeenCalledWith(EventTypes.STEP_END, { experimentId: 'exp-123', stepNumber: 0 });

        expect(mockExperiment.status).toBe('COMPLETED');
        expect(mockExperiment.result).toBe('Goal B'); // The description of the met goal
        expect(mockEventBusEmit).toHaveBeenCalledWith(EventTypes.EXPERIMENT_END, { experimentId: 'exp-123', result: 'Goal B' });

        // Should NOT have run Step 1
        expect(mockEventBusEmit).not.toHaveBeenCalledWith(EventTypes.STEP_START, { experimentId: 'exp-123', stepNumber: 1 });
    });

    test('should iterate through roles in each step', async () => {
        mockPlan.maxSteps = 1; // Run 1 step successfully then fail on next check

        await orchestrator.start();

        // Step 0
        // Role A
        expect(mockEventBusEmit).toHaveBeenCalledWith(EventTypes.ROLE_START, { experimentId: 'exp-123', roleName: 'RoleA' });
        // Role B
        expect(mockEventBusEmit).toHaveBeenCalledWith(EventTypes.ROLE_START, { experimentId: 'exp-123', roleName: 'RoleB' });
    });

    test('should handle errors in loop gracefully', async () => {
        mockPlan.maxSteps = 5;
        // Mock processStep to throw
        orchestrator.processStep = jest.fn().mockRejectedValue(new Error('Random Crash'));

        await orchestrator.start();

        expect(mockExperiment.status).toBe('FAILED');
        expect(mockExperiment.result).toContain('Random Crash');
    });
});
