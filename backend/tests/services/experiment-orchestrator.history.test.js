const { ExperimentOrchestrator } = require('../../src/services/experiment-orchestrator.service');
const { EventTypes } = require('../../src/services/event-bus');
const ProviderService = require('../../src/services/provider/provider.service');
const ContainerPoolManager = require('../../src/services/container-pool.service');
const { Provider } = require('../../src/models/provider.model');
const Tool = require('../../src/models/tool.model');

jest.mock('../../src/services/provider/provider.service');
jest.mock('../../src/services/container-pool.service');
jest.mock('../../src/services/logger.service');
jest.mock('../../src/models/experiment.model');
jest.mock('../../src/models/experimentPlan.model');
jest.mock('../../src/models/tool.model');
jest.mock('../../src/models/provider.model');

describe('ExperimentOrchestrator Chat History', () => {
    let orchestrator;
    let mockExperiment;
    let mockPlan;

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup Orchestrator
        orchestrator = new ExperimentOrchestrator('test-exp-id');
        orchestrator.eventBus = { emit: jest.fn(), emitAsync: jest.fn().mockResolvedValue() };

        // Mock Data
        mockExperiment = {
            _id: 'test-exp-id',
            currentStep: 1,
            currentEnvironment: {
                variables: { weather: 'sunny' }
            },
            roleHistory: new Map(),
            markModified: jest.fn(),
            save: jest.fn().mockResolvedValue(true)
        };

        mockPlan = {
            roles: [
                {
                    name: 'Meteorologist',
                    systemPrompt: 'You are a weather expert.',
                    variableWhitelist: [],
                    modelConfig: { provider: 'mock-provider-id', modelName: 'llama3' }
                }
            ],
            maxStepRetries: 1
        };

        orchestrator.experiment = mockExperiment;
        orchestrator.plan = mockPlan;
        orchestrator.isInitialized = true;

        // Mock Provider Lookup
        Provider.findById.mockResolvedValue({
            type: 'OLLAMA',
            baseUrl: 'http://localhost:11434'
        });

        // Mock Container (not focusing on tool execution details here)
        ContainerPoolManager.getInstance.mockReturnValue({
            acquire: jest.fn().mockResolvedValue({
                execute: jest.fn().mockResolvedValue({ stdout: '{}', exitCode: 0 }),
                destroy: jest.fn()
            })
        });
    });

    it('should initialize history and send correct prompt on first turn', async () => {
        // Mock Chat Response
        // Simulate a simple text response
        const mockStream = (async function* () {
            yield { type: 'text', content: 'It is sunny.' };
        })();
        ProviderService.chat.mockResolvedValue(mockStream);

        await orchestrator.processRole(mockPlan.roles[0]);

        // Verify loaded history was empty initially
        const roleHistory = mockExperiment.roleHistory.get('Meteorologist');
        // Because we push AFTER execution, we check what was persisted or what was sent.

        // 1. Verify ProviderService.chat was called with [System, User]
        expect(ProviderService.chat).toHaveBeenCalledTimes(1);
        const callArgs = ProviderService.chat.mock.calls[0];
        const sentMessages = callArgs[2]; // 3rd arg is history

        expect(sentMessages).toHaveLength(2);
        expect(sentMessages[0].role).toBe('system');
        expect(sentMessages[0].content).toBe('You are a weather expert.');
        expect(sentMessages[1].role).toBe('user');
        expect(sentMessages[1].content).toContain('Step 1');
        expect(sentMessages[1].content).toContain('weather');

        // 2. Verify History Persistence
        // Should have saved the User message + Assistant response
        expect(mockExperiment.save).toHaveBeenCalled();
        expect(roleHistory).toHaveLength(2);
        expect(roleHistory[0].role).toBe('user'); // User message stored first in history
        expect(roleHistory[1].role).toBe('assistant');
        expect(roleHistory[1].content).toBe('It is sunny.');
    });

    it('should include previous history in prompt for subsequent steps', async () => {
        // Setup existing history
        const existingHistory = [
            { role: 'user', content: 'Step 0...' },
            { role: 'assistant', content: 'Hello!' }
        ];
        mockExperiment.roleHistory.set('Meteorologist', existingHistory);
        mockExperiment.currentStep = 2; // Next step

        // Mock Chat Response
        const mockStream = (async function* () {
            yield { type: 'text', content: 'Still sunny.' };
        })();
        ProviderService.chat.mockResolvedValue(mockStream);

        await orchestrator.processRole(mockPlan.roles[0]);

        // 1. Verify ProviderService.chat called with [System, ...Existing, NewUser]
        expect(ProviderService.chat).toHaveBeenCalledTimes(1);
        const sentMessages = ProviderService.chat.mock.calls[0][2];

        // Length: 1 (System) + 2 (Existing) + 1 (New User) = 4
        expect(sentMessages).toHaveLength(4);
        expect(sentMessages[0].content).toBe('You are a weather expert.');
        expect(sentMessages[1].content).toBe('Step 0...');
        expect(sentMessages[2].content).toBe('Hello!');
        expect(sentMessages[3].content).toContain('Step 2');

        // 2. Verify Persistence
        // Should have appended NewUser + NewAssistant
        const updatedHistory = mockExperiment.roleHistory.get('Meteorologist');
        expect(updatedHistory).toHaveLength(4); // 2 existing + 2 new
        expect(updatedHistory[2].content).toContain('Step 2');
        expect(updatedHistory[3].content).toBe('Still sunny.');
    });

    it('should persist tool calls correctly in history', async () => {
        // Mock Tool Call Response
        // Turn 1: Model calls tool
        // Turn 2: Model responds after tool result

        // Emulate streaming with tool call
        const mockStream1 = (async function* () {
            yield { type: 'text', content: 'Checking weather...' };
            yield { type: 'tool_call', toolName: 'get_weather', args: {} };
        })();

        const mockStream2 = (async function* () {
            yield { type: 'text', content: 'The weather is 75 degrees.' };
        })();

        // Mock ProviderService.chat to return stream1 then stream2
        ProviderService.chat
            .mockResolvedValueOnce(mockStream1)
            .mockResolvedValueOnce(mockStream2);

        // Mock Tool lookup
        Tool.findOne.mockResolvedValue({
            name: 'get_weather',
            code: 'print("tool")',
            endsTurn: false
        });

        await orchestrator.processRole(mockPlan.roles[0]);

        // Verify ProviderService.chat called twice
        expect(ProviderService.chat).toHaveBeenCalledTimes(2);

        // Verify Persistence
        const roleHistory = mockExperiment.roleHistory.get('Meteorologist');

        // Expected items in history:
        // 1. User (Step 1)
        // 2. Assistant (Thinking + Tool Call)
        // 3. Tool (Result)
        // 4. Assistant (Final Response)
        expect(roleHistory).toHaveLength(4);

        expect(roleHistory[0].role).toBe('user');

        expect(roleHistory[1].role).toBe('assistant');
        expect(roleHistory[1].content).toBe('Checking weather...');
        expect(roleHistory[1].tool_calls).toBeDefined();

        expect(roleHistory[2].role).toBe('tool');
        expect(roleHistory[2].name).toBe('get_weather');

        expect(roleHistory[3].role).toBe('assistant');
        expect(roleHistory[3].content).toBe('The weather is 75 degrees.');
    });
});
