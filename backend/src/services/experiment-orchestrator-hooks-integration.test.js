/**
 * Integration tests for Script & Hook System
 * Tests that scripts attached to various lifecycle events execute correctly.
 */
const { ExperimentOrchestrator } = require('./experiment-orchestrator.service');
const ContainerPoolManager = require('./container-pool.service');
const { EventTypes } = require('./event-bus');

jest.mock('./container-pool.service');
jest.mock('./logger.service');
jest.mock('../models/experiment.model');
jest.mock('../models/experimentPlan.model');
jest.mock('../models/tool.model');

describe('Script Hook Integration Tests', () => {
    let orchestrator;
    let mockContainer;
    let mockExperiment;
    let mockPlan;
    let emittedEvents;
    let hookExecutions;

    beforeEach(() => {
        // Track hook executions
        hookExecutions = [];

        // Mock Container that tracks what hooks were called
        mockContainer = {
            execute: jest.fn().mockImplementation((cmd, opts) => {
                // Extract hook code from environment
                const codeEnv = opts?.Env?.find(e => e.startsWith('HOOK_CODE='));
                const contextEnv = opts?.Env?.find(e => e.startsWith('HOOK_CONTEXT='));

                let hookType = 'UNKNOWN';
                if (contextEnv) {
                    try {
                        const context = JSON.parse(contextEnv.replace('HOOK_CONTEXT=', ''));
                        // Try to identify from event payload structure
                        if (context.event?.planName) hookType = 'EXPERIMENT_START';
                        else if (context.event?.stepNumber !== undefined && context.event?.environmentSnapshot) hookType = 'STEP_END';
                        else if (context.event?.stepNumber !== undefined) hookType = 'STEP_START';
                        else if (context.event?.result !== undefined && context.event?.duration !== undefined) hookType = 'EXPERIMENT_END';
                        else if (context.event?.toolName && context.event?.args && !context.event?.result) hookType = 'BEFORE_TOOL_CALL';
                        else if (context.event?.toolName && context.event?.result !== undefined) hookType = 'AFTER_TOOL_CALL';
                    } catch (e) { }
                }

                hookExecutions.push({
                    hookType,
                    code: codeEnv?.replace('HOOK_CODE=', ''),
                    timestamp: Date.now()
                });

                return Promise.resolve({
                    stdout: JSON.stringify({ success: true, environment: {} }),
                    stderr: '',
                    exitCode: 0
                });
            }),
            destroy: jest.fn().mockResolvedValue()
        };

        // Mock Pool Manager singleton
        ContainerPoolManager.getInstance.mockReturnValue({
            acquire: jest.fn().mockResolvedValue(mockContainer)
        });

        // Track emitted events
        emittedEvents = [];

        orchestrator = new ExperimentOrchestrator('test-exp-id');

        mockExperiment = {
            _id: 'test-exp-id',
            planId: 'test-plan-id',
            status: 'RUNNING',
            currentEnvironment: {
                variables: { counter: 0 }
            },
            currentStep: 0,
            startTime: new Date(),
            save: jest.fn().mockResolvedValue()
        };

        mockPlan = {
            name: 'Test Plan',
            scripts: [],
            goals: [],
            roles: [],
            maxSteps: 5
        };

        orchestrator.experiment = mockExperiment;
        orchestrator.plan = mockPlan;
        orchestrator.isInitialized = true;

        // Replace eventBus with one that tracks emissions
        const originalEmit = orchestrator.eventBus.emit.bind(orchestrator.eventBus);
        orchestrator.eventBus.emit = jest.fn((type, payload) => {
            emittedEvents.push({ type, payload });
            return originalEmit(type, payload);
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('EXPERIMENT_START hook', () => {
        it('should execute script when EXPERIMENT_START event is emitted', async () => {
            const script = {
                hookType: 'EXPERIMENT_START',
                code: 'print("Hello World EXPERIMENT_START")',
                failPolicy: 'ABORT_EXPERIMENT',
                executionMode: 'SYNC'
            };

            // Register the hook manually (simulating initialize)
            orchestrator.eventBus.on('EXPERIMENT_START', async (payload) => {
                await orchestrator.executeHook(script, payload);
            });

            // Emit the event
            orchestrator.eventBus.emit(EventTypes.EXPERIMENT_START, {
                experimentId: 'test-exp-id',
                planName: 'Test Plan'
            });

            // Wait for async execution
            await new Promise(resolve => setTimeout(resolve, 50));

            expect(hookExecutions.length).toBeGreaterThanOrEqual(1);
            expect(hookExecutions.some(h => h.hookType === 'EXPERIMENT_START')).toBe(true);
            expect(mockContainer.execute).toHaveBeenCalled();
            expect(mockContainer.destroy).toHaveBeenCalled();
        });
    });

    describe('STEP_START hook', () => {
        it('should execute script when STEP_START event is emitted', async () => {
            const script = {
                hookType: 'STEP_START',
                code: 'print("Hello World STEP_START")',
                failPolicy: 'ABORT_EXPERIMENT',
                executionMode: 'SYNC'
            };

            orchestrator.eventBus.on('STEP_START', async (payload) => {
                await orchestrator.executeHook(script, payload);
            });

            orchestrator.eventBus.emit(EventTypes.STEP_START, {
                experimentId: 'test-exp-id',
                stepNumber: 1
            });

            await new Promise(resolve => setTimeout(resolve, 50));

            expect(hookExecutions.length).toBeGreaterThanOrEqual(1);
            expect(hookExecutions.some(h => h.hookType === 'STEP_START')).toBe(true);
        });
    });

    describe('STEP_END hook', () => {
        it('should execute script when STEP_END event is emitted', async () => {
            const script = {
                hookType: 'STEP_END',
                code: 'print("Hello World STEP_END")',
                failPolicy: 'ABORT_EXPERIMENT',
                executionMode: 'SYNC'
            };

            orchestrator.eventBus.on('STEP_END', async (payload) => {
                await orchestrator.executeHook(script, payload);
            });

            orchestrator.eventBus.emit(EventTypes.STEP_END, {
                experimentId: 'test-exp-id',
                stepNumber: 1,
                environmentSnapshot: { variables: { counter: 1 } }
            });

            await new Promise(resolve => setTimeout(resolve, 50));

            expect(hookExecutions.length).toBeGreaterThanOrEqual(1);
            expect(hookExecutions.some(h => h.hookType === 'STEP_END')).toBe(true);
        });
    });

    describe('EXPERIMENT_END hook', () => {
        it('should execute script when EXPERIMENT_END event is emitted', async () => {
            const script = {
                hookType: 'EXPERIMENT_END',
                code: 'print("Hello World EXPERIMENT_END")',
                failPolicy: 'ABORT_EXPERIMENT',
                executionMode: 'SYNC'
            };

            orchestrator.eventBus.on('EXPERIMENT_END', async (payload) => {
                await orchestrator.executeHook(script, payload);
            });

            orchestrator.eventBus.emit(EventTypes.EXPERIMENT_END, {
                experimentId: 'test-exp-id',
                result: 'Goal Met',
                duration: 5000
            });

            await new Promise(resolve => setTimeout(resolve, 50));

            expect(hookExecutions.length).toBeGreaterThanOrEqual(1);
            expect(hookExecutions.some(h => h.hookType === 'EXPERIMENT_END')).toBe(true);
        });
    });

    describe('BEFORE_TOOL_CALL hook', () => {
        it('should execute script when BEFORE_TOOL_CALL event is emitted', async () => {
            const script = {
                hookType: 'BEFORE_TOOL_CALL',
                code: 'print("Hello World BEFORE_TOOL_CALL")',
                failPolicy: 'ABORT_EXPERIMENT',
                executionMode: 'SYNC'
            };

            orchestrator.eventBus.on('BEFORE_TOOL_CALL', async (payload) => {
                await orchestrator.executeHook(script, payload);
            });

            orchestrator.eventBus.emit(EventTypes.BEFORE_TOOL_CALL, {
                experimentId: 'test-exp-id',
                toolName: 'test_tool',
                args: { param1: 'value1' }
            });

            await new Promise(resolve => setTimeout(resolve, 50));

            expect(hookExecutions.length).toBeGreaterThanOrEqual(1);
            expect(hookExecutions.some(h => h.hookType === 'BEFORE_TOOL_CALL')).toBe(true);
        });
    });

    describe('AFTER_TOOL_CALL hook', () => {
        it('should execute script when AFTER_TOOL_CALL event is emitted', async () => {
            const script = {
                hookType: 'AFTER_TOOL_CALL',
                code: 'print("Hello World AFTER_TOOL_CALL")',
                failPolicy: 'ABORT_EXPERIMENT',
                executionMode: 'SYNC'
            };

            orchestrator.eventBus.on('AFTER_TOOL_CALL', async (payload) => {
                await orchestrator.executeHook(script, payload);
            });

            orchestrator.eventBus.emit(EventTypes.AFTER_TOOL_CALL, {
                experimentId: 'test-exp-id',
                toolName: 'test_tool',
                result: { output: 'success' }
            });

            await new Promise(resolve => setTimeout(resolve, 50));

            expect(hookExecutions.length).toBeGreaterThanOrEqual(1);
            expect(hookExecutions.some(h => h.hookType === 'AFTER_TOOL_CALL')).toBe(true);
        });
    });

    describe('Multiple hooks registration', () => {
        it('should register and execute multiple hooks for different events', async () => {
            const scripts = [
                { hookType: 'EXPERIMENT_START', code: 'env["started"] = True', failPolicy: 'ABORT_EXPERIMENT', executionMode: 'SYNC' },
                { hookType: 'STEP_START', code: 'env["step_started"] = True', failPolicy: 'ABORT_EXPERIMENT', executionMode: 'SYNC' },
                { hookType: 'STEP_END', code: 'env["step_ended"] = True', failPolicy: 'ABORT_EXPERIMENT', executionMode: 'SYNC' }
            ];

            // Register all hooks
            for (const script of scripts) {
                orchestrator.eventBus.on(script.hookType, async (payload) => {
                    await orchestrator.executeHook(script, payload);
                });
            }

            // Emit events in lifecycle order
            orchestrator.eventBus.emit(EventTypes.EXPERIMENT_START, { experimentId: 'test-exp-id', planName: 'Test' });
            await new Promise(resolve => setTimeout(resolve, 50));

            orchestrator.eventBus.emit(EventTypes.STEP_START, { experimentId: 'test-exp-id', stepNumber: 1 });
            await new Promise(resolve => setTimeout(resolve, 50));

            orchestrator.eventBus.emit(EventTypes.STEP_END, { experimentId: 'test-exp-id', stepNumber: 1, environmentSnapshot: {} });
            await new Promise(resolve => setTimeout(resolve, 50));

            expect(hookExecutions.length).toBe(3);
        });
    });

    describe('Hook environment modification', () => {
        it('should merge environment changes back from hook execution', async () => {
            const script = {
                hookType: 'STEP_START',
                code: 'env["modified_by_hook"] = True',
                failPolicy: 'ABORT_EXPERIMENT',
                executionMode: 'SYNC'
            };

            // Mock container to return modified environment
            mockContainer.execute.mockResolvedValue({
                stdout: JSON.stringify({
                    success: true,
                    environment: { counter: 0, modified_by_hook: true }
                }),
                stderr: '',
                exitCode: 0
            });

            await orchestrator.executeHook(script, { stepNumber: 1 });

            expect(orchestrator.experiment.currentEnvironment.variables.modified_by_hook).toBe(true);
        });
    });
});
