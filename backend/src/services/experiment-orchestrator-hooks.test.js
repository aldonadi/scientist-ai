const { ExperimentOrchestrator } = require('./experiment-orchestrator.service');
const ContainerPoolManager = require('./container-pool.service');
const { EventTypes } = require('./event-bus');

jest.mock('./container-pool.service');
jest.mock('./logger.service');
jest.mock('../models/experiment.model');
jest.mock('../models/experimentPlan.model');
jest.mock('../models/tool.model');

describe('ExperimentOrchestrator Hook System', () => {
    let orchestrator;
    let mockContainer;
    let mockExperiment;
    let mockPlan;

    beforeEach(() => {
        // Mock Container
        mockContainer = {
            execute: jest.fn(),
            destroy: jest.fn().mockResolvedValue()
        };

        // Mock Pool Manager singleton
        ContainerPoolManager.getInstance.mockReturnValue({
            acquire: jest.fn().mockResolvedValue(mockContainer)
        });

        orchestrator = new ExperimentOrchestrator('test-exp-id');

        mockExperiment = {
            _id: 'test-exp-id',
            planId: 'test-plan-id',
            status: 'RUNNING',
            currentEnvironment: {
                variables: { counter: 0, flag: false }
            },
            currentStep: 1
        };
        mockPlan = {
            scripts: [],
            goals: [],
            roles: [],
            maxSteps: 10
        };
        orchestrator.experiment = mockExperiment;
        orchestrator.plan = mockPlan;
        orchestrator.eventBus = { emit: jest.fn(), on: jest.fn() };
        orchestrator.isInitialized = true;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Script Registration', () => {
        it('should register hooks during initialization', async () => {
            // Reset to allow initialize() to run
            orchestrator.isInitialized = false;
            orchestrator.plan.scripts = [
                { hookType: 'EXPERIMENT_START', code: 'print("hello")', failPolicy: 'ABORT_EXPERIMENT', executionMode: 'SYNC' },
                { hookType: 'STEP_START', code: 'print("step")', failPolicy: 'CONTINUE_WITH_ERROR', executionMode: 'SYNC' }
            ];

            // Mock DB calls
            const { Experiment } = require('../models/experiment.model');
            const { ExperimentPlan } = require('../models/experimentPlan.model');
            Experiment.findById = jest.fn().mockResolvedValue(mockExperiment);
            ExperimentPlan.findById = jest.fn().mockResolvedValue(mockPlan);
            mockExperiment.save = jest.fn().mockResolvedValue();

            await orchestrator.initialize();

            // Verify eventBus.on was called for each script
            expect(orchestrator.eventBus.on).toHaveBeenCalledTimes(2);
            expect(orchestrator.eventBus.on).toHaveBeenCalledWith('EXPERIMENT_START', expect.any(Function));
            expect(orchestrator.eventBus.on).toHaveBeenCalledWith('STEP_START', expect.any(Function));
            expect(orchestrator.registeredHooks).toHaveLength(2);
        });

        it('should not register hooks if no scripts defined', async () => {
            orchestrator.isInitialized = false;
            orchestrator.plan.scripts = [];

            const { Experiment } = require('../models/experiment.model');
            const { ExperimentPlan } = require('../models/experimentPlan.model');
            Experiment.findById = jest.fn().mockResolvedValue(mockExperiment);
            ExperimentPlan.findById = jest.fn().mockResolvedValue(mockPlan);
            mockExperiment.save = jest.fn().mockResolvedValue();

            await orchestrator.initialize();

            expect(orchestrator.eventBus.on).not.toHaveBeenCalled();
            expect(orchestrator.registeredHooks).toHaveLength(0);
        });
    });

    describe('executeHook()', () => {
        it('should execute hook script and merge environment changes', async () => {
            const script = {
                hookType: 'STEP_START',
                code: 'env["counter"] = env["counter"] + 1',
                failPolicy: 'ABORT_EXPERIMENT',
                executionMode: 'SYNC'
            };

            mockContainer.execute.mockResolvedValue({
                stdout: JSON.stringify({ success: true, environment: { counter: 1, flag: false } }),
                stderr: '',
                exitCode: 0
            });

            await orchestrator.executeHook(script, { stepNumber: 1 });

            // Verify environment was merged
            expect(orchestrator.experiment.currentEnvironment.variables.counter).toBe(1);
            expect(mockContainer.destroy).toHaveBeenCalled();
        });

        it('should pass correct context to container', async () => {
            const script = {
                hookType: 'EXPERIMENT_START',
                code: 'print("test")',
                failPolicy: 'ABORT_EXPERIMENT',
                executionMode: 'SYNC'
            };

            mockContainer.execute.mockResolvedValue({
                stdout: JSON.stringify({ success: true, environment: {} }),
                exitCode: 0
            });

            await orchestrator.executeHook(script, { experimentId: 'test-exp-id' });

            const callArgs = mockContainer.execute.mock.calls[0];
            const opts = callArgs[1];

            expect(opts.Env).toBeDefined();
            const contextEnv = opts.Env.find(e => e.startsWith('HOOK_CONTEXT='));
            const codeEnv = opts.Env.find(e => e.startsWith('HOOK_CODE='));

            expect(contextEnv).toBeDefined();
            expect(codeEnv).toContain('print("test")');

            const contextJson = contextEnv.replace('HOOK_CONTEXT=', '');
            const context = JSON.parse(contextJson);
            expect(context.experiment.id).toBe('test-exp-id');
            expect(context.environment.variables.counter).toBe(0);
        });

        it('should throw on ABORT_EXPERIMENT policy when script fails', async () => {
            const script = {
                hookType: 'STEP_START',
                code: 'raise Exception("test error")',
                failPolicy: 'ABORT_EXPERIMENT',
                executionMode: 'SYNC'
            };

            mockContainer.execute.mockResolvedValue({
                stdout: JSON.stringify({ success: false, error: 'test error' }),
                stderr: '',
                exitCode: 0
            });

            await expect(orchestrator.executeHook(script, {})).rejects.toThrow('test error');
            expect(mockContainer.destroy).toHaveBeenCalled();
        });

        it('should continue on CONTINUE_WITH_ERROR policy when script fails', async () => {
            const script = {
                hookType: 'STEP_START',
                code: 'raise Exception("test error")',
                failPolicy: 'CONTINUE_WITH_ERROR',
                executionMode: 'SYNC'
            };

            mockContainer.execute.mockResolvedValue({
                stdout: JSON.stringify({ success: false, error: 'test error' }),
                stderr: '',
                exitCode: 0
            });

            // Should not throw
            await orchestrator.executeHook(script, {});

            expect(orchestrator.eventBus.emit).toHaveBeenCalledWith(EventTypes.LOG, expect.objectContaining({
                source: 'HOOK',
                message: expect.stringContaining('failed')
            }));
            expect(mockContainer.destroy).toHaveBeenCalled();
        });

        it('should handle non-zero exit codes', async () => {
            const script = {
                hookType: 'STEP_START',
                code: 'syntax error',
                failPolicy: 'ABORT_EXPERIMENT',
                executionMode: 'SYNC'
            };

            mockContainer.execute.mockResolvedValue({
                stdout: '',
                stderr: 'SyntaxError: invalid syntax',
                exitCode: 1
            });

            await expect(orchestrator.executeHook(script, {})).rejects.toThrow('SyntaxError');
            expect(mockContainer.destroy).toHaveBeenCalled();
        });
    });

    describe('_handleHookEvent()', () => {
        it('should await SYNC scripts', async () => {
            const script = {
                hookType: 'STEP_START',
                code: 'pass',
                failPolicy: 'ABORT_EXPERIMENT',
                executionMode: 'SYNC'
            };

            mockContainer.execute.mockResolvedValue({
                stdout: JSON.stringify({ success: true, environment: {} }),
                exitCode: 0
            });

            // Spy on executeHook
            orchestrator.executeHook = jest.fn().mockResolvedValue();

            await orchestrator._handleHookEvent(script, {});

            expect(orchestrator.executeHook).toHaveBeenCalledWith(script, {});
        });

        it('should fire-and-forget ASYNC scripts', async () => {
            const script = {
                hookType: 'STEP_START',
                code: 'pass',
                failPolicy: 'ABORT_EXPERIMENT',
                executionMode: 'ASYNC'
            };

            let resolveExecution;
            orchestrator.executeHook = jest.fn().mockReturnValue(
                new Promise(resolve => { resolveExecution = resolve; })
            );

            // Should return immediately without waiting
            const handlePromise = orchestrator._handleHookEvent(script, {});

            // The handler should return immediately for async
            await handlePromise;

            expect(orchestrator.executeHook).toHaveBeenCalled();

            // Clean up
            resolveExecution();
        });
    });
});
