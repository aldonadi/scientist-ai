const { ExperimentOrchestrator } = require('./experiment-orchestrator.service');
const ContainerPoolManager = require('./container-pool.service');
const { EventTypes } = require('./event-bus');

jest.mock('./container-pool.service');
jest.mock('./logger.service');
jest.mock('../models/experiment.model');
jest.mock('../models/experimentPlan.model');
jest.mock('../models/tool.model');

describe('ExperimentOrchestrator Goal Evaluation', () => {
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

        // Setup Orchestrator (mocking the constructor dependencies indirectly or just instantiating)
        // Constructor creates EventBus and Logger.
        orchestrator = new ExperimentOrchestrator('test-exp-id');

        // Mock internal state manually to avoid calling initialize()
        mockExperiment = {
            _id: 'test-exp-id',
            currentEnvironment: {
                variables: { money: 100, status: 'cloudy' }
            },
            currentStep: 1
        };
        mockPlan = {
            goals: []
        };
        orchestrator.experiment = mockExperiment;
        orchestrator.plan = mockPlan;
        orchestrator.eventBus = { emit: jest.fn() };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return null if no goals defined in plan', async () => {
        const result = await orchestrator.evaluateGoals();
        expect(result).toBeNull();
    });

    it('should return null if condition evaluates to false', async () => {
        orchestrator.plan.goals = [{
            description: 'Get Rich',
            conditionScript: 'money > 1000'
        }];

        mockContainer.execute.mockResolvedValue({
            stdout: JSON.stringify({ result: false }),
            stderr: '',
            exitCode: 0
        });

        const result = await orchestrator.evaluateGoals();
        expect(result).toBeNull();

        // Verify container calls
        expect(mockContainer.execute).toHaveBeenCalled();
        expect(mockContainer.destroy).toHaveBeenCalled();
    });

    it('should return goal description if condition evaluates to true', async () => {
        orchestrator.plan.goals = [{
            description: 'Have Money',
            conditionScript: 'money >= 100'
        }];

        mockContainer.execute.mockResolvedValue({
            stdout: JSON.stringify({ result: true }),
            stderr: '',
            exitCode: 0
        });

        const result = await orchestrator.evaluateGoals();
        expect(result).toBe('Have Money');
        expect(mockContainer.destroy).toHaveBeenCalled();
    });

    it('should pass correct environment variables and condition to container', async () => {
        orchestrator.plan.goals = [{
            description: 'Check Env',
            conditionScript: 'status == "cloudy"'
        }];

        mockContainer.execute.mockResolvedValue({
            stdout: JSON.stringify({ result: false }),
            exitCode: 0
        });

        await orchestrator.evaluateGoals();

        const callArgs = mockContainer.execute.mock.calls[0];
        const cmd = callArgs[0];
        const opts = callArgs[1];

        // Verify python command
        expect(cmd[0]).toBe('python3');
        expect(cmd[2]).toContain('import os');

        // Verify Env injection
        expect(opts.Env).toBeDefined();
        const envVar = opts.Env.find(e => e.startsWith('EXPERIMENT_ENV='));
        const condVar = opts.Env.find(e => e.startsWith('GOAL_CONDITION='));

        expect(envVar).toContain(JSON.stringify(mockExperiment.currentEnvironment.variables));
        expect(condVar).toContain('status == "cloudy"');
    });

    it('should handle Python execution errors gracefully (throw and log)', async () => {
        orchestrator.plan.goals = [{
            description: 'Broken',
            conditionScript: 'syntax error'
        }];

        // Simulate internal python error caught and printed as JSON error
        mockContainer.execute.mockResolvedValue({
            stdout: JSON.stringify({ error: 'NameError: name "syntax" is not defined' }),
            exitCode: 0
        });

        await expect(orchestrator.evaluateGoals()).rejects.toThrow('NameError');

        expect(orchestrator.eventBus.emit).toHaveBeenCalledWith(EventTypes.LOG, expect.objectContaining({
            message: expect.stringContaining('Goal evaluation failed'),
            data: { error: 'NameError: name "syntax" is not defined' }
        }));

        expect(mockContainer.destroy).toHaveBeenCalled();
    });

    it('should handle Container execution failures (exit code != 0)', async () => {
        orchestrator.plan.goals = [{ description: 'Crash', conditionScript: 'pass' }];

        mockContainer.execute.mockResolvedValue({
            stdout: '',
            stderr: 'Container Logic Error',
            exitCode: 1
        });

        await expect(orchestrator.evaluateGoals()).rejects.toThrow('Container Logic Error');
        expect(mockContainer.destroy).toHaveBeenCalled();
    });
});
