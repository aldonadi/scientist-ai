const OllamaStrategy = require('../../src/services/provider/strategies/ollama-strategy');

// Configuration
const OLLAMA_HOST = 'http://localhost:11434';
const MODEL_NAME = 'gpt-oss:20b';
const NUM_RUNS = 5;
const SUCCESS_THRESHOLD = 3;

// Tool Definition
const tools = [{
    type: 'function',
    function: {
        name: 'set_flag',
        description: 'Sets a specific flag to true or false',
        parameters: {
            type: 'object',
            properties: {
                flag_name: {
                    type: 'string',
                    description: 'The name of the flag to set'
                },
                value: {
                    type: 'boolean',
                    description: 'The value to set the flag to'
                }
            },
            required: ['flag_name', 'value']
        }
    }
}];

// Mock Provider Config
const providerConfig = {
    baseUrl: OLLAMA_HOST,
    type: 'OLLAMA'
};

describe('Live Tool Calling Verification (Ollama)', () => {
    let strategy;

    beforeAll(() => {
        strategy = new OllamaStrategy();
        // Increase timeout for live model interactions
        jest.setTimeout(120000);
    });

    it(`should successfully call tools at least ${SUCCESS_THRESHOLD}/${NUM_RUNS} times`, async () => {
        let successCount = 0;

        console.log(`Starting ${NUM_RUNS} runs with model ${MODEL_NAME} on ${OLLAMA_HOST}...`);

        for (let i = 0; i < NUM_RUNS; i++) {
            console.log(`\nRun ${i + 1}/${NUM_RUNS}:`);
            const history = [
                { role: 'system', content: 'You are a helpful assistant. You have access to a tool called set_flag. If the user asks you to set a flag, use the tool.' },
                { role: 'user', content: 'Please enable the "test_mode" flag.' }
            ];

            let toolCalled = false;
            let fullResponse = '';

            try {
                // Call chat
                const stream = strategy.chat(providerConfig, MODEL_NAME, history, tools, { temperature: 0.1 });

                for await (const event of stream) {
                    if (event.type === 'text') {
                        process.stdout.write(event.content);
                        fullResponse += event.content;
                    } else if (event.type === 'tool_call') {
                        console.log('\n[TOOL CALL DETECTED]:', event);
                        if (event.toolName === 'set_flag') {
                            // Check args roughly
                            if (event.args.flag_name === 'test_mode') {
                                toolCalled = true;
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Run failed with error:', error.message);
            }

            if (toolCalled) {
                console.log('\nResult: SUCCESS');
                successCount++;
            } else {
                console.log('\nResult: FAILURE - No tool call detected');
            }
        }

        console.log(`\nFinal Score: ${successCount}/${NUM_RUNS}`);
        expect(successCount).toBeGreaterThanOrEqual(SUCCESS_THRESHOLD);
    });
});
