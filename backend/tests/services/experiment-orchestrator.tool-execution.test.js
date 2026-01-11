const { ExperimentOrchestrator } = require('../../src/services/experiment-orchestrator.service');
const { EventBus, EventTypes } = require('../../src/services/event-bus');
const { Experiment } = require('../../src/models/experiment.model');
const { ExperimentPlan } = require('../../src/models/experimentPlan.model');
const Tool = require('../../src/models/tool.model');
const ProviderService = require('../../src/services/provider/provider.service');
const mongoose = require('mongoose');

jest.mock('../../src/services/container-pool.service');
const ContainerPoolManager = require('../../src/services/container-pool.service');
jest.mock('../../src/services/provider/provider.service');
jest.mock('../../src/models/experiment.model');
jest.mock('../../src/models/experimentPlan.model');
jest.mock('../../src/models/tool.model');

describe('ExperimentOrchestrator Tool Execution', () => {
    let orchestrator;
    let mockExperiment;
    let mockPlan;
    let mockContainer;
    let mockEventBusEmit;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Setup common mock data
        mockExperiment = {
            _id: new mongoose.Types.ObjectId(),
            status: 'RUNNING',
            currentStep: 1,
            currentEnvironment: { variables: { output: '' } },
            planId: new mongoose.Types.ObjectId(),
            save: jest.fn().mockResolvedValue(true)
        };

        mockPlan = {
            _id: mockExperiment.planId,
            name: 'Test Plan',
            maxSteps: 5,
            roles: [{
                name: 'Tester',
                systemPrompt: 'You are a tester.',
                tools: [new mongoose.Types.ObjectId()], // One tool
                variableWhitelist: []
            }],
            goals: []
        };

        mockContainer = {
            execute: jest.fn().mockResolvedValue({ stdout: '{"result": "success"}', stderr: '', exitCode: 0 }),
            destroy: jest.fn().mockResolvedValue(true)
        };

        // Setup Model Mocks
        Experiment.findById.mockResolvedValue(mockExperiment);
        ExperimentPlan.findById.mockResolvedValue(mockPlan);
        Tool.find.mockResolvedValue([{
            name: 'test_tool',
            description: 'A test tool',
            parameters: {},
            code: 'print("hello")'
        }]);
        Tool.findOne.mockResolvedValue({
            name: 'test_tool',
            description: 'A test tool',
            parameters: {},
            code: 'print("hello")'
        });

        // Setup ContainerPoolManager Mock
        ContainerPoolManager.getInstance.mockReturnValue({
            acquire: jest.fn().mockResolvedValue(mockContainer)
        });

        // Setup ProviderService Mock to simulate Tool Call
        // This simulates: Text -> Tool Call -> Result -> Text
        const mockGenerator = async function* () {
            yield { type: 'text', content: 'I will run the tool.' };
            yield {
                type: 'tool_call',
                toolName: 'test_tool',
                args: { arg: 1 }
            };
            yield { type: 'text', content: 'Tool execution complete.' };
        };
        ProviderService.chat.mockReturnValue(mockGenerator());

        // Instantiate
        orchestrator = new ExperimentOrchestrator(mockExperiment._id);

        // Spy on internal event bus
        // access the private instance or mock the class? 
        // ExperimentOrchestrator creates a new EventBus internally.
        // We can spy on the emit method of that internal bus if accessible, 
        // or spy on orchestrator.eventBus.emit if we can access it.
        // Since we are unit testing, we can access the property after instantiation?
        // Wait, initialize() needs to be called.
    });

    it('should detect and execute a tool call', async () => {
        await orchestrator.initialize();

        // Spy on event bus
        const emitSpy = jest.spyOn(orchestrator.eventBus, 'emit');

        // Capture environment updates
        mockExperiment.currentEnvironment = { variables: {} };

        // Run one step (or role process)
        await orchestrator.processRole(mockPlan.roles[0]);

        // assert TOOL_CALL emitted
        expect(emitSpy).toHaveBeenCalledWith(EventTypes.TOOL_CALL, expect.objectContaining({
            toolName: 'test_tool',
            args: { arg: 1 }
        }));

        // assert container acquired
        expect(ContainerPoolManager.getInstance().acquire).toHaveBeenCalled();

        // assert tool executed
        expect(mockContainer.execute).toHaveBeenCalledWith(
            'print("hello")',
            expect.any(Object),
            { arg: 1 }
        );

        // assert TOOL_RESULT emitted
        expect(emitSpy).toHaveBeenCalledWith(EventTypes.TOOL_RESULT, expect.objectContaining({
            toolName: 'test_tool',
            result: { result: 'success' }
        }));

        // assert container destroyed
        expect(mockContainer.destroy).toHaveBeenCalled();

        // assert environment update (if your logic creates side effects in env, 
        // but here the tool output needs to be merged OR simply logged as result. 
        // The story says "Updates Variables map with result")
        expect(mockExperiment.currentEnvironment.variables).toEqual(expect.objectContaining({
            result: 'success'
        }));
    });
});
