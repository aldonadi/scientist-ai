const mongoose = require('mongoose');
const { ExperimentOrchestrator } = require('./experiment-orchestrator.service');
const { EventTypes } = require('./event-bus');
const { ExperimentPlan } = require('../models/experimentPlan.model');
const { Experiment } = require('../models/experiment.model');
const Tool = require('../models/tool.model');
const { Provider } = require('../models/provider.model');
const ContainerPoolManager = require('./container-pool.service');
const ProviderService = require('./provider/provider.service');

// Mock dependencies
jest.mock('./container-pool.service');
jest.mock('./provider/provider.service');

describe('ExperimentOrchestrator End-to-End Environment Types', () => {
    let orchestrator;
    let mockExperiment;
    let mockPlan;
    let mockContainer;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // 1. Setup Mock Container
        mockContainer = {
            execute: jest.fn(),
            destroy: jest.fn().mockResolvedValue()
        };
        ContainerPoolManager.getInstance.mockReturnValue({
            acquire: jest.fn().mockResolvedValue(mockContainer)
        });

        // 2. Setup Mock Experiment and Plan
        mockPlan = {
            _id: new mongoose.Types.ObjectId(),
            initialEnvironment: {
                variables: {
                    str_var: 'start',
                    int_var: 10,
                    list_var: ['a', 'b'],
                    dict_var: { x: 1 }
                },
                variableTypes: {
                    str_var: 'string',
                    int_var: 'int',
                    list_var: 'array',
                    dict_var: 'object'
                }
            },
            roles: [{
                name: 'DataRole',
                modelConfig: { provider: 'providerId' },
                tools: ['toolId1'],
                systemPrompt: 'You update data.',
                variableWhitelist: []
            }],
            goals: [],
            scripts: [{
                hookType: 'AFTER_STEP',
                code: 'script_code_here',
                executionMode: 'SYNC'
            }],
            maxSteps: 1,
            maxStepRetries: 3
        };

        mockExperiment = {
            _id: new mongoose.Types.ObjectId(),
            planId: mockPlan._id,
            status: 'RUNNING',
            currentStep: 1,
            currentEnvironment: JSON.parse(JSON.stringify(mockPlan.initialEnvironment)),
            history: [],
            markModified: jest.fn(),
            save: jest.fn().mockResolvedValue(true)
        };
    });

    it('should correctly pass and persist complex environment types through Tool and Script execution', async () => {
        // --- Setup Mocks ---

        // DB Lookups
        Experiment.findById = jest.fn().mockResolvedValue(mockExperiment);
        ExperimentPlan.findById = jest.fn().mockResolvedValue(mockPlan);
        Provider.findById = jest.fn().mockResolvedValue({ type: 'openai' });

        const mockTool = {
            _id: 'toolId1',
            name: 'UpdateEnvTool',
            code: 'tool_code_here',
            endsTurn: true
        };
        Tool.find = jest.fn().mockResolvedValue([mockTool]);
        Tool.findOne = jest.fn().mockResolvedValue(mockTool);

        // Chat Completion Mock
        async function* mockChat() {
            yield { type: 'tool_call', toolName: 'UpdateEnvTool', args: {} };
        }
        ProviderService.chat.mockReturnValue(mockChat());

        // Container Execution Mock logic
        mockContainer.execute.mockImplementation(async (command, options) => {
            let inputEnv = {};
            // Determine input env based on context
            if (options.TOOL_ENV) {
                inputEnv = JSON.parse(options.TOOL_ENV);
            } else if (options.HOOK_CONTEXT) {
                // Hook context contains 'environment'
                const ctx = JSON.parse(options.HOOK_CONTEXT);
                inputEnv = ctx.environment;
            }

            let outputEnv = JSON.parse(JSON.stringify(inputEnv || {}));

            if (options.TOOL_CODE) { // Tool execution
                // Verify Tool Input
                expect(inputEnv.str_var).toBe('start');
                expect(inputEnv.int_var).toBe(10);
                expect(inputEnv.list_var).toEqual(['a', 'b']);
                expect(inputEnv.dict_var).toEqual({ x: 1 });

                outputEnv.str_var = 'tool_updated';
                outputEnv.int_var = 20;
                outputEnv.list_var.push('tool');
                outputEnv.dict_var.y = 2;

                return {
                    stdout: JSON.stringify({
                        success: true,
                        environment: outputEnv,
                        result: 'Tool Done'
                    }),
                    exitCode: 0
                };
            } else { // Script execution
                // Verify Script Input (should be updated by tool)
                // Note: If previous step failed, these assertions fail
                // For robustness, we check only if we are in this block

                // If the hook executes, it means tool update logic ran.
                // The inputEnv *should* be the updated one from Experiment state.

                // We assert here to prove passing works.
                if (Object.keys(inputEnv).length > 0) {
                    expect(inputEnv.str_var).toBe('tool_updated');
                    expect(inputEnv.int_var).toBe(20);
                    expect(inputEnv.list_var).toEqual(['a', 'b', 'tool']);
                    expect(inputEnv.dict_var).toEqual({ x: 1, y: 2 });
                }

                outputEnv.str_var = 'script_updated';
                outputEnv.int_var = 30;
                outputEnv.list_var.push('script');
                outputEnv.dict_var.z = 3;

                return {
                    stdout: JSON.stringify({
                        success: true,
                        environment: outputEnv
                    }),
                    exitCode: 0
                };
            }
        });

        // --- Execute ---
        orchestrator = new ExperimentOrchestrator(mockExperiment._id);
        orchestrator.experiment = mockExperiment;
        orchestrator.plan = mockPlan;

        // Mock EventBus
        orchestrator.eventBus = {
            emit: jest.fn(),
            emitAsync: jest.fn().mockImplementation(async (event, payload) => {
                // Trigger hook on STEP_END
                if (event === EventTypes.STEP_END) {
                    await orchestrator._handleHookEvent(mockPlan.scripts[0], payload);
                }
            }),
            on: jest.fn()
        };

        // We only run ONE Step for this test
        await orchestrator.processStep();

        // --- Verify Final State Persistence ---
        const finalEnv = mockExperiment.currentEnvironment.variables;

        expect(finalEnv.str_var).toBe('script_updated');
        expect(finalEnv.int_var).toBe(30);
        expect(finalEnv.list_var).toHaveLength(4);
        expect(finalEnv.list_var).toEqual(['a', 'b', 'tool', 'script']);
        expect(finalEnv.dict_var).toEqual({ x: 1, y: 2, z: 3 });

        expect(Array.isArray(finalEnv.list_var)).toBe(true);
        expect(typeof finalEnv.dict_var).toBe('object');
    });
});
