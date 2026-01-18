const { ExperimentOrchestrator } = require('./experiment-orchestrator.service');
const { EventTypes } = require('./event-bus');
const { ExperimentPlan } = require('../models/experimentPlan.model');
const { Experiment } = require('../models/experiment.model');
const Tool = require('../models/tool.model');
const { Provider } = require('../models/provider.model');
const ContainerPoolManager = require('./container-pool.service');
const ProviderService = require('./provider/provider.service');

jest.mock('../models/experiment.model', () => ({
    Experiment: {
        findById: jest.fn()
    }
}));
jest.mock('../models/experimentPlan.model', () => ({
    ExperimentPlan: {
        findById: jest.fn()
    }
}));
jest.mock('../models/tool.model', () => ({
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn()
}));
jest.mock('../models/provider.model', () => ({
    Provider: {
        findById: jest.fn()
    }
}));
jest.mock('./container-pool.service', () => ({
    getInstance: jest.fn()
}));
jest.mock('./provider/provider.service', () => ({
    chat: jest.fn()
}));

describe('ExperimentOrchestrator Tool Turn Logic', () => {
    let orchestrator;
    let mockExperiment;
    let mockPlan;
    let mockContainer;

    beforeEach(() => {
        mockContainer = {
            execute: jest.fn().mockResolvedValue({ stdout: '{"success":true}', exitCode: 0 }),
            destroy: jest.fn().mockResolvedValue()
        };
        ContainerPoolManager.getInstance.mockReturnValue({
            acquire: jest.fn().mockResolvedValue(mockContainer)
        });

        orchestrator = new ExperimentOrchestrator('exp-id');
        orchestrator.eventBus = { emit: jest.fn(), emitAsync: jest.fn().mockResolvedValue() };

        mockExperiment = {
            _id: 'exp-id',
            currentEnvironment: { variables: {} },
            currentStep: 1,
            markModified: jest.fn(),
            save: jest.fn().mockResolvedValue()
        };
        orchestrator.experiment = mockExperiment;

        mockPlan = {
            maxStepRetries: 3
        };
        orchestrator.plan = mockPlan;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // Helper to create a mock async generator for chat response
    async function* mockChatResponse(events) {
        for (const event of events) {
            yield event;
        }
    }

    it('should End Turn if tool has endsTurn=true', async () => {
        const role = {
            name: 'RoleA',
            modelConfig: { provider: 'providerId' },
            tools: ['toolId1']
        };

        // Mock Provider Lookup
        Provider.findById.mockResolvedValue({ type: 'openai', baseUrl: '...', apiKeyRef: '...' });

        // Mock Tool Lookup (for Provider resolution) called before loop
        Tool.find.mockResolvedValue([{
            _id: 'toolId1',
            name: 'TerminalTool',
            parameters: {},
            endsTurn: true // Important
        }]);

        // Mock Tool Lookup (inside tool execution loop)
        Tool.findOne.mockResolvedValue({
            name: 'TerminalTool',
            code: '...',
            endsTurn: true
        });

        // Mock Chat: 1st call returns Tool Call
        ProviderService.chat.mockReturnValue(mockChatResponse([
            { type: 'tool_call', toolName: 'TerminalTool', args: {} }
        ]));

        await orchestrator.processRole(role);

        // Expect exactly 1 call to Chat (because loop should stop)
        expect(ProviderService.chat).toHaveBeenCalledTimes(1);
    });

    it('should Continue Turn if tool has endsTurn=false', async () => {
        const role = {
            name: 'RoleB',
            modelConfig: { provider: 'providerId' },
            tools: ['toolId2']
        };

        Provider.findById.mockResolvedValue({ type: 'openai', baseUrl: '...', apiKeyRef: '...' });

        Tool.find.mockResolvedValue([{
            _id: 'toolId2',
            name: 'ChainTool',
            parameters: {},
            endsTurn: false
        }]);

        Tool.findOne.mockImplementation((query) => {
            if (query.name === 'ChainTool') {
                return Promise.resolve({ name: 'ChainTool', code: '...', endsTurn: false });
            }
            return Promise.resolve(null);
        });

        // Mock Chat responses
        // 1st call: Returns Tool Call
        // 2nd call: Returns Text "Done" (Stop)
        ProviderService.chat
            .mockReturnValueOnce(mockChatResponse([
                { type: 'tool_call', toolName: 'ChainTool', args: {} }
            ]))
            .mockReturnValueOnce(mockChatResponse([
                { type: 'text', content: 'Finished' }
            ]));

        await orchestrator.processRole(role);

        // Expect 2 calls to Chat (1st -> tool, loop continues -> 2nd -> text)
        expect(ProviderService.chat).toHaveBeenCalledTimes(2);
    });

    it('should default to Ends Turn if endsTurn is undefined', async () => {
        const role = {
            name: 'RoleC',
            modelConfig: { provider: 'providerId' },
            tools: ['toolId3']
        };

        Provider.findById.mockResolvedValue({ type: 'openai', baseUrl: '...', apiKeyRef: '...' });

        Tool.find.mockResolvedValue([{
            _id: 'toolId3',
            name: 'LegacyTool',
            parameters: {}
            // endsTurn undefined
        }]);

        Tool.findOne.mockResolvedValue({
            name: 'LegacyTool',
            code: '...',
            // endsTurn undefined
        });

        ProviderService.chat.mockReturnValue(mockChatResponse([
            { type: 'tool_call', toolName: 'LegacyTool', args: {} }
        ]));

        await orchestrator.processRole(role);

        // Expect 1 call (Default is True -> Stop)
        expect(ProviderService.chat).toHaveBeenCalledTimes(1);
    });

    it('should filter environment variables based on whitelist', async () => {
        // Setup environment
        orchestrator.experiment.currentEnvironment.variables = {
            SECRET: 'hidden',
            PUBLIC: 'visible'
        };

        const role = {
            name: 'SecureRole',
            modelConfig: { provider: 'providerId' },
            variableWhitelist: ['PUBLIC'], // Only see PUBLIC
            tools: []
        };

        Provider.findById.mockResolvedValue({ type: 'openai' });
        Tool.find.mockResolvedValue([]);

        // Mock chat to verify input messages
        ProviderService.chat.mockImplementation(async (config, model, messages) => {
            // Verify the last message (User prompt) contains only whitelisted vars
            const lastMsg = messages[messages.length - 1];
            if (!lastMsg.content.includes('"PUBLIC":"visible"')) {
                throw new Error('Missing PUBLIC variable');
            }
            if (lastMsg.content.includes('SECRET')) {
                throw new Error('Leaked SECRET variable');
            }
            return mockChatResponse([{ type: 'text', content: 'ok' }]);
        });

        await orchestrator.processRole(role);
    });
    it('should emit BEFORE_TOOL_CALL with toolName in payload', async () => {
        const role = {
            name: 'HookRole',
            modelConfig: { provider: 'providerId' },
            tools: ['toolId4']
        };

        // Ensure Provider is correctly mocked with findById
        Provider.findById.mockResolvedValue({ type: 'openai' });

        Tool.find.mockResolvedValue([{
            _id: 'toolId4',
            name: 'ContextTool',
            parameters: {},
            endsTurn: true
        }]);

        Tool.findOne.mockResolvedValue({
            name: 'ContextTool',
            code: '...',
            endsTurn: true
        });

        ProviderService.chat.mockReturnValue(mockChatResponse([
            { type: 'tool_call', toolName: 'ContextTool', args: { foo: 'bar' } }
        ]));

        await orchestrator.processRole(role);

        expect(orchestrator.eventBus.emitAsync).toHaveBeenCalledWith(
            EventTypes.BEFORE_TOOL_CALL,
            expect.objectContaining({
                toolName: 'ContextTool',
                args: { foo: 'bar' },
                experimentId: 'exp-id'
            })
        );
    });
});
