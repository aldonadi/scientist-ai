const { ExperimentOrchestrator } = require('../src/services/experiment-orchestrator.service');
const { Experiment } = require('../src/models/experiment.model');
const { ExperimentPlan } = require('../src/models/experimentPlan.model');
const Tool = require('../src/models/tool.model');
const { EventTypes } = require('../src/services/event-bus');
const mongoose = require('mongoose');

// Mock dependencies
jest.mock('../src/models/experiment.model');
jest.mock('../src/models/experimentPlan.model');
jest.mock('../src/models/tool.model');

describe('ExperimentOrchestrator - Role Prompt Construction', () => {
    let orchestrator;
    let mockExperiment;
    let mockPlan;
    let mockEventBusEmit;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        mockExperiment = {
            _id: new mongoose.Types.ObjectId(),
            status: 'RUNNING',
            currentStep: 1,
            currentEnvironment: {
                variables: {
                    allowedVar: 'success',
                    secretVar: 'hidden',
                    complexVar: { nested: true }
                }
            },
            save: jest.fn().mockResolvedValue(true)
        };

        mockPlan = {
            roles: [],
            goals: []
        };

        Experiment.findById.mockResolvedValue(mockExperiment);
        ExperimentPlan.findById.mockResolvedValue(mockPlan);

        orchestrator = new ExperimentOrchestrator('exp123');
        // Manually inject loaded state for testing processRole directly
        orchestrator.experiment = mockExperiment;
        orchestrator.plan = mockPlan;
        orchestrator.isInitialized = true;

        // Spy on event bus
        mockEventBusEmit = jest.spyOn(orchestrator.eventBus, 'emit');
    });

    test('should construct prompt with filtered environment based on whitelist', async () => {
        const role = {
            name: 'TestRole',
            systemPrompt: 'You are a tester.',
            variableWhitelist: ['allowedVar'], // Only allow this one
            tools: []
        };

        await orchestrator.processRole(role);

        // Verify MODEL_PROMPT event
        expect(mockEventBusEmit).toHaveBeenCalledWith(EventTypes.MODEL_PROMPT, expect.objectContaining({
            experimentId: mockExperiment._id,
            roleName: 'TestRole',
            messages: expect.any(Array)
        }));

        const callArgs = mockEventBusEmit.mock.calls.find(call => call[0] === EventTypes.MODEL_PROMPT)[1];
        const userMessage = callArgs.messages.find(m => m.role === 'user');

        // Should contain allowedVar
        expect(userMessage.content).toContain('"allowedVar":"success"');
        // Should NOT contain secretVar
        expect(userMessage.content).not.toContain('"secretVar":"hidden"');
    });

    test('should provide full environment if whitelist is empty/undefined', async () => {
        const role = {
            name: 'TestRole',
            systemPrompt: 'You are a tester.',
            variableWhitelist: [], // Empty means all? Or undefined means all? Implementation chose "empty or undefined = all" fallback
            tools: []
        };

        await orchestrator.processRole(role);

        const callArgs = mockEventBusEmit.mock.calls.find(call => call[0] === EventTypes.MODEL_PROMPT)[1];
        const userMessage = callArgs.messages.find(m => m.role === 'user');

        expect(userMessage.content).toContain('"allowedVar":"success"');
        expect(userMessage.content).toContain('"secretVar":"hidden"');
    });

    test('should resolve tools and include in payload', async () => {
        const toolId = new mongoose.Types.ObjectId();
        const role = {
            name: 'ToolRole',
            systemPrompt: 'Use tools.',
            variableWhitelist: ['allowedVar'],
            tools: [toolId]
        };

        const mockTool = {
            name: 'market_tool',
            description: 'A tool for marketing',
            parameters: { type: 'object' }
        };
        Tool.find.mockResolvedValue([mockTool]);

        await orchestrator.processRole(role);

        const callArgs = mockEventBusEmit.mock.calls.find(call => call[0] === EventTypes.MODEL_PROMPT)[1];

        expect(Tool.find).toHaveBeenCalledWith({ _id: { $in: [toolId] } });
        expect(callArgs.tools).toHaveLength(1);
        expect(callArgs.tools[0]).toEqual({
            name: 'market_tool',
            description: 'A tool for marketing',
            parameters: { type: 'object' }
        });
    });

    test('should construct correct system and user messages', async () => {
        const role = {
            name: 'ChatRole',
            systemPrompt: 'Be concise.',
            variableWhitelist: ['allowedVar'],
            tools: []
        };

        await orchestrator.processRole(role);

        const callArgs = mockEventBusEmit.mock.calls.find(call => call[0] === EventTypes.MODEL_PROMPT)[1];
        const messages = callArgs.messages;

        expect(messages).toHaveLength(2);
        expect(messages[0]).toEqual({ role: 'system', content: 'Be concise.' });
        expect(messages[1].role).toBe('user');
        expect(messages[1].content).toContain('Step 1. Current Environment:');
    });
});
