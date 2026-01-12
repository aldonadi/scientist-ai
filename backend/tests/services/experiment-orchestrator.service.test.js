const mongoose = require('mongoose');
const { ExperimentOrchestrator } = require('../../src/services/experiment-orchestrator.service');
const { Experiment } = require('../../src/models/experiment.model');
const { ExperimentPlan } = require('../../src/models/experimentPlan.model');
const { EventTypes } = require('../../src/services/event-bus');

// Mock dependencies
jest.mock('../../src/models/experiment.model');
jest.mock('../../src/models/experimentPlan.model');
jest.mock('../../src/services/logger.service');
const Logger = require('../../src/services/logger.service');

describe('ExperimentOrchestrator Service', () => {
    let orchestrator;
    const mockExperimentId = new mongoose.Types.ObjectId();
    const mockPlanId = new mongoose.Types.ObjectId();

    const mockExperiment = {
        _id: mockExperimentId,
        planId: mockPlanId,
        status: 'INITIALIZING',
        currentEnvironment: { variables: {}, variableTypes: {} },
        save: jest.fn().mockResolvedValue(true)
    };

    const mockPlan = {
        _id: mockPlanId,
        name: 'Test Plan',
        initialEnvironment: { variables: { foo: 'bar' }, variableTypes: { foo: 'string' } },
        roles: []
    };

    beforeEach(() => {
        jest.clearAllMocks();
        Experiment.findById.mockResolvedValue(mockExperiment);
        ExperimentPlan.findById.mockResolvedValue(mockPlan);
    });

    describe('constructor', () => {
        it('should throw error if experimentId is missing', () => {
            expect(() => new ExperimentOrchestrator()).toThrow('Experiment ID is required');
        });

        it('should initialize properties correctly', () => {
            orchestrator = new ExperimentOrchestrator(mockExperimentId);
            expect(orchestrator.experimentId).toBe(mockExperimentId);
            expect(orchestrator.isInitialized).toBe(false);
            expect(orchestrator.eventBus).toBeDefined();
            expect(orchestrator.logger).toBeDefined();
        });
    });

    describe('initialize', () => {
        beforeEach(() => {
            orchestrator = new ExperimentOrchestrator(mockExperimentId);
        });

        it('should load experiment and plan successfully', async () => {
            await orchestrator.initialize();

            expect(Experiment.findById).toHaveBeenCalledWith(mockExperimentId);
            expect(ExperimentPlan.findById).toHaveBeenCalledWith(mockPlanId);
            expect(orchestrator.experiment).toEqual(mockExperiment);
            expect(orchestrator.plan).toEqual(mockPlan);
            expect(orchestrator.isInitialized).toBe(true);
        });

        it('should throw error if experiment not found', async () => {
            Experiment.findById.mockResolvedValue(null);
            await expect(orchestrator.initialize()).rejects.toThrow(/Experiment not found/);
        });

        it('should throw error if plan not found', async () => {
            ExperimentPlan.findById.mockResolvedValue(null);
            await expect(orchestrator.initialize()).rejects.toThrow(/ExperimentPlan not found/);
        });

        it('should populate initial environment if empty', async () => {
            const emptyExp = { ...mockExperiment, currentEnvironment: { variables: {} } };
            Experiment.findById.mockResolvedValue(emptyExp);

            await orchestrator.initialize();

            expect(emptyExp.currentEnvironment).toEqual(mockPlan.initialEnvironment);
            expect(emptyExp.save).toHaveBeenCalled();
        });

        it('should be idempotent', async () => {
            await orchestrator.initialize();
            Experiment.findById.mockClear();
            await orchestrator.initialize();

            expect(Experiment.findById).not.toHaveBeenCalled();
        });
    });

    describe('start', () => {
        beforeEach(async () => {
            orchestrator = new ExperimentOrchestrator(mockExperimentId);
            // Mock runLoop to avoid infinite loop in basic start test
            orchestrator.runLoop = jest.fn();
        });

        it('should initialize if not already initialized', async () => {
            const initSpy = jest.spyOn(orchestrator, 'initialize');
            await orchestrator.start();
            expect(initSpy).toHaveBeenCalled();
        });

        it('should update experiment status to RUNNING', async () => {
            await orchestrator.start();
            expect(mockExperiment.status).toBe('RUNNING');
            expect(mockExperiment.startTime).toBeInstanceOf(Date);
            expect(mockExperiment.save).toHaveBeenCalled();
        });

        it('should emit EXPERIMENT_START event', async () => {
            const emitSpy = jest.spyOn(orchestrator.eventBus, 'emit');
            await orchestrator.start();

            expect(emitSpy).toHaveBeenCalledWith(EventTypes.EXPERIMENT_START, {
                experimentId: mockExperimentId,
                planName: mockPlan.name
            });
        });
    });

    describe('runLoop', () => {
        beforeEach(async () => {
            orchestrator = new ExperimentOrchestrator(mockExperimentId);
            await orchestrator.initialize();
            orchestrator.experiment.status = 'RUNNING';
            orchestrator.experiment.currentStep = 0;
            orchestrator.plan.maxSteps = 2;
        });

        it('should run until maxSteps is reached', async () => {
            const processStepSpy = jest.spyOn(orchestrator, 'processStep').mockResolvedValue();

            await orchestrator.runLoop();

            expect(processStepSpy).toHaveBeenCalledTimes(2);
            expect(mockExperiment.status).toBe('FAILED'); // Hits max steps
            expect(mockExperiment.result).toBe('Max Steps Exceeded');
            expect(mockExperiment.save).toHaveBeenCalled();
        });

        it('should emit STEP events with correct payloads', async () => {
            const emitSpy = jest.spyOn(orchestrator.eventBus, 'emit');
            // Run only 1 step
            orchestrator.plan.maxSteps = 1;

            // Re-setup experiment state since initialize() uses the mock object reference
            mockExperiment.currentStep = 0;
            mockExperiment.status = 'RUNNING';

            await orchestrator.runLoop();

            // STEP_START
            expect(emitSpy).toHaveBeenCalledWith(EventTypes.STEP_START, expect.objectContaining({
                stepNumber: 0
            }));

            // STEP_END with environmentSnapshot
            expect(emitSpy).toHaveBeenCalledWith(EventTypes.STEP_END, expect.objectContaining({
                stepNumber: 0,
                environmentSnapshot: expect.anything()
            }));

            // EXPERIMENT_END with duration
            expect(emitSpy).toHaveBeenCalledWith(EventTypes.EXPERIMENT_END, expect.objectContaining({
                result: 'Max Steps Exceeded',
                duration: expect.any(Number)
            }));
        });

        it('should terminate if external status changes to PAUSED', async () => {
            const processStepSpy = jest.spyOn(orchestrator, 'processStep');

            // Mock findById to return RUNNING first, then PAUSED
            Experiment.findById
                .mockResolvedValueOnce({ ...mockExperiment, status: 'RUNNING' }) // Initial check
                .mockResolvedValueOnce({ ...mockExperiment, status: 'PAUSED' }); // Inside loop

            await orchestrator.runLoop();

            // Should not process any steps because status changed immediately
            expect(processStepSpy).not.toHaveBeenCalled();
            expect(orchestrator.experiment.status).toBe('PAUSED');
        });

        it('should handle goal evaluation success', async () => {
            // Mock evaluateGoals to return true on first try
            orchestrator.evaluateGoals = jest.fn().mockResolvedValue('Goal Met');

            await orchestrator.runLoop();

            expect(mockExperiment.status).toBe('COMPLETED');
            expect(mockExperiment.result).toBe('Goal Met');
            expect(mockExperiment.save).toHaveBeenCalled();
        });

        it('should handle goal evaluation error properly', async () => {
            // Mock evaluateGoals to throw error
            orchestrator.evaluateGoals = jest.fn().mockRejectedValue(new Error('Evaluation Failed'));
            const emitSpy = jest.spyOn(orchestrator.eventBus, 'emit');

            await orchestrator.runLoop();

            expect(mockExperiment.status).toBe('FAILED');
            expect(mockExperiment.result).toContain('Evaluation Failed');
            expect(emitSpy).toHaveBeenCalledWith(EventTypes.EXPERIMENT_END, expect.objectContaining({
                result: 'Failed',
                error: 'Evaluation Failed'
            }));
        });
    });
});
