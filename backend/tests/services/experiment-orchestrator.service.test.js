const mongoose = require('mongoose');
const { ExperimentOrchestrator } = require('../../src/services/experiment-orchestrator.service');
const { Experiment } = require('../../src/models/experiment.model');
const { ExperimentPlan } = require('../../src/models/experimentPlan.model');
const { EventTypes } = require('../../src/services/event-bus');

// Mock dependencies
jest.mock('../../src/models/experiment.model');
jest.mock('../../src/models/experimentPlan.model');

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
        initialEnvironment: { variables: { foo: 'bar' }, variableTypes: { foo: 'string' } }
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
            // Auto initialize for start tests usually, but let's test the auto-init
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
});
