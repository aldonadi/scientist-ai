const { EventBus, EventTypes } = require('./event-bus');
const { Experiment } = require('../models/experiment.model');
const { ExperimentPlan } = require('../models/experimentPlan.model');
const Tool = require('../models/tool.model');
const { deepCopy } = require('../models/schemas/environment.schema');
const Logger = require('./logger.service');
const ContainerPoolManager = require('./container-pool.service');

class ExperimentOrchestrator {
    constructor(experimentId) {
        if (!experimentId) {
            throw new Error('Experiment ID is required');
        }
        this.experimentId = experimentId;
        this.eventBus = new EventBus();
        this.logger = new Logger(this.eventBus);
        this.experiment = null;
        this.plan = null;
        this.isInitialized = false;
        this.registeredHooks = []; // Track registered hook handlers for cleanup
    }

    /**
     * Loads the experiment and plan from the database.
     * Sets up the event bus and logger.
     */
    async initialize() {
        if (this.isInitialized) {
            return;
        }

        // 1. Fetch Experiment
        this.experiment = await Experiment.findById(this.experimentId);
        if (!this.experiment) {
            throw new Error(`Experiment not found: ${this.experimentId}`);
        }

        // 2. Fetch Plan
        this.plan = await ExperimentPlan.findById(this.experiment.planId);
        if (!this.plan) {
            throw new Error(`ExperimentPlan not found: ${this.experiment.planId}`);
        }

        // 3. Populate initial environment if not already present (idempotency)
        // Note: The Experiment model defaults currentEnvironment, but we might want to ensure
        // it reflects the plan's initialEnvironment if it's a fresh run.
        // For now, we assume the Experiment creation logic handled this, or we'll handle it here.
        if (!this.experiment.currentEnvironment || Object.keys(this.experiment.currentEnvironment.variables).length === 0) {
            if (this.plan.initialEnvironment) {
                // Ensure we do a deep copy or safe assignment if needed.
                // Mongoose handles basic object assignment well.
                // We will set it, but we need to save to persist.
                this.experiment.currentEnvironment = this.plan.initialEnvironment;
                await this.experiment.save();
            }
        }

        // 4. Script Registration - Register hooks from the plan
        if (this.plan.scripts && this.plan.scripts.length > 0) {
            for (const script of this.plan.scripts) {
                const handler = async (eventPayload) => {
                    await this._handleHookEvent(script, eventPayload);
                };
                this.eventBus.on(script.hookType, handler);
                this.registeredHooks.push({ hookType: script.hookType, handler });
            }
        }

        this.isInitialized = true;
    }

    /**
     * Starts the experiment execution.
     * Emits EXPERIMENT_START.
     */
    async start() {
        if (!this.isInitialized) {
            await this.initialize();
        }

        this.experiment.status = 'RUNNING';
        if (!this.experiment.startTime) {
            this.experiment.startTime = new Date();
        }
        await this.experiment.save();

        this.eventBus.emit(EventTypes.EXPERIMENT_START, {
            experimentId: this.experiment._id,
            planName: this.plan.name
        });

        // Start the loop
        await this.runLoop();
    }

    /**
     * Main execution loop.
     * Iterates until completion or failure.
     */
    /**
     * Main execution loop.
     * Iterates until completion or failure.
     */
    async runLoop() {
        // Initial refresh of status before starting loop
        this.experiment = await Experiment.findById(this.experimentId);

        while (
            this.experiment.status === 'RUNNING' &&
            this.experiment.currentStep < this.plan.maxSteps
        ) {
            try {
                // Refresh experiment state from DB to catch external status changes (PAUSE/STOP)
                // We re-fetch strictly to check status, but we must be careful not to overwrite
                // local changes to currentEnvironment if we haven't saved them yet.
                // However, since we save at the end of every loop iteration, it should be safe.
                const freshExperiment = await Experiment.findById(this.experimentId);
                if (!freshExperiment) {
                    throw new Error('Experiment deleted during execution');
                }

                // If external actor changed status, respect it
                if (freshExperiment.status !== 'RUNNING') {
                    this.experiment.status = freshExperiment.status;
                    this.eventBus.emit(EventTypes.LOG, {
                        experimentId: this.experiment._id,
                        stepNumber: this.experiment.currentStep,
                        source: 'SYSTEM',
                        message: `Execution stopped external status change: ${freshExperiment.status}`
                    });
                    return;
                }

                await this.processStep();

                // Goal Evaluation
                const goalMet = await this.evaluateGoals();
                if (goalMet) {
                    this.experiment.status = 'COMPLETED';
                    this.experiment.result = goalMet;
                    this.experiment.endTime = new Date();
                    const duration = this.experiment.endTime - this.experiment.startTime;

                    await this.experiment.save();
                    this.eventBus.emit(EventTypes.EXPERIMENT_END, {
                        experimentId: this.experiment._id,
                        result: goalMet,
                        duration: duration
                    });
                    return;
                }

                // Check Max Steps
                this.experiment.currentStep += 1;
                if (this.experiment.currentStep >= this.plan.maxSteps) {
                    this.experiment.status = 'FAILED';
                    this.experiment.result = 'Max Steps Exceeded';
                    this.experiment.endTime = new Date();
                    const duration = this.experiment.endTime - this.experiment.startTime;

                    await this.experiment.save();
                    this.eventBus.emit(EventTypes.EXPERIMENT_END, {
                        experimentId: this.experiment._id,
                        result: 'Max Steps Exceeded',
                        duration: duration
                    });
                    return;
                }

                await this.experiment.save();

            } catch (error) {
                this.eventBus.emit(EventTypes.LOG, {
                    experimentId: this.experiment._id,
                    stepNumber: this.experiment.currentStep,
                    source: 'SYSTEM',
                    message: 'Error in execution loop',
                    data: { error: error.message }
                });
                this.experiment.status = 'FAILED';
                this.experiment.result = `Error: ${error.message}`;
                this.experiment.endTime = new Date();
                const duration = this.experiment.endTime - this.experiment.startTime;

                await this.experiment.save();

                this.eventBus.emit(EventTypes.EXPERIMENT_END, {
                    experimentId: this.experiment._id,
                    result: 'Failed',
                    duration: duration,
                    error: error.message
                });
                return;
            }
        }
    }

    /**
     * Executes a single step.
     */
    async processStep() {
        const step = this.experiment.currentStep;

        this.eventBus.emit(EventTypes.STEP_START, {
            experimentId: this.experiment._id,
            stepNumber: step
        });

        // Role Iteration
        for (const role of this.plan.roles) {
            await this.processRole(role);
        }

        this.eventBus.emit(EventTypes.STEP_END, {
            experimentId: this.experiment._id,
            stepNumber: step,
            environmentSnapshot: this.experiment.currentEnvironment
        });
    }

    /**
     * Processing for a single role.
     * Constructs the prompt, resolves tools, and emits the MODEL_PROMPT event.
     */
    async processRole(role) {
        this.eventBus.emit(EventTypes.ROLE_START, {
            experimentId: this.experiment._id,
            roleName: role.name
        });

        // 1. Environment Isolation
        // Create a deep copy to prevent mutation by the LLM (mental sandbox)
        // and filter based on whitelist.
        const fullEnv = deepCopy(this.experiment.currentEnvironment);
        const filteredEnv = { variables: {} };

        // If whitelist is empty, we might decide to show nothing or everything.
        // Spec implies we filter. If whitelist is not defined, we assume access to nothing?
        // Or maybe everything? Let's assume explicit whitelist means "only these".
        // If whitelist is empty array, they get nothing.
        // If whitelist is undefined/null, let's give them everything (safe default for dev, but restrictive is better for prod).
        // Spec: "variableWhitelist: List<String> (Defines which Environment variables this Role can see)"
        // Implementation: If whitelist is present, filter. If not present (or empty array depending on schema default), 
        // strictly speaking they see nothing if it's an allowlist.
        // Looking at schema default: RoleSchema.variableWhitelist type [String].

        const whitelist = role.variableWhitelist;
        if (whitelist && whitelist.length > 0) {
            whitelist.forEach(key => {
                if (fullEnv.variables.hasOwnProperty(key)) {
                    filteredEnv.variables[key] = fullEnv.variables[key];
                }
            });
        } else {
            // If no whitelist is provided, we default to showing EVERYTHING or NOTHING?
            // "Defines which variables this Role can see" -> Implies restriction.
            // Let's copy everything if whitelist is missing to be friendly, 
            // BUT if it's an empty array, it means "none".
            // Mongoose defaults arrays to [] if not specified in some cases, or undefined.
            // Let's assume if it is explicitly empty, show keys.
            if (!whitelist || whitelist.length === 0) {
                // Warning: This policy might need review. For now, if empty, we provide all.
                // This is easier for "Generic" roles.
                filteredEnv.variables = fullEnv.variables;
            }
        }

        // 2. Tool Resolution
        // We need to fetch the full Tool definitions for the provider.
        // role.tools is an array of ObjectIds.
        let toolsForProvider = [];
        if (role.tools && role.tools.length > 0) {
            const toolDocs = await Tool.find({ _id: { $in: role.tools } });

            // Map to the format expected by the Provider/LLM
            toolsForProvider = toolDocs.map(t => ({
                name: t.name,
                description: t.description,
                parameters: t.parameters
            }));
        }

        // 3. Prompt Construction
        const step = this.experiment.currentStep;
        const messages = [
            {
                role: 'system',
                content: role.systemPrompt
            },
            {
                role: 'user',
                content: `Step ${step}. Current Environment: ${JSON.stringify(filteredEnv.variables)}`
            }
        ];

        // 4. Emit MODEL_PROMPT
        // Hooks can listen to this and modify 'messages' if needed.
        this.eventBus.emit(EventTypes.MODEL_PROMPT, {
            experimentId: this.experiment._id,
            roleName: role.name,
            messages: messages,
            tools: toolsForProvider
        });

        // 5. Inference & Tool Execution Loop
        const ProviderService = require('./provider/provider.service');
        // ContainerPoolManager imported at top-level

        let shouldContinue = true;
        let accumulatedResponse = '';
        let currentMessages = [...messages];
        let toolCalls = [];

        // Safety limit for tool loops to prevent infinite recursions
        let loopCount = 0;
        const MAX_TOOL_LOOPS = 5;

        while (shouldContinue && loopCount < MAX_TOOL_LOOPS) {
            shouldContinue = false; // Default to stop unless tool call forces continuance
            accumulatedResponse = '';
            toolCalls = [];

            // We need to pass the config. For now using defaults or role.modelConfig if available
            // Assuming role.modelConfig has the provider and modelName

            // Temporarily constructed provider object for the service
            // This should ideally come from a populated modelConfig
            const providerConfig = {
                type: role.modelConfig ? role.modelConfig.provider : 'OLLAMA', // Default
                baseUrl: process.env.OLLAMA_HOST || 'http://localhost:11434' // TODO: Get from DB/Config
            };
            const modelName = role.modelConfig ? role.modelConfig.modelName : 'llama3';

            try {
                const stream = await ProviderService.chat(
                    providerConfig,
                    modelName,
                    currentMessages,
                    toolsForProvider,
                    { temperature: role.modelConfig?.temperature || 0.7 }
                );

                for await (const event of stream) {
                    if (event.type === 'text') {
                        accumulatedResponse += event.content;
                        this.eventBus.emit(EventTypes.MODEL_RESPONSE_CHUNK, {
                            experimentId: this.experiment._id,
                            roleName: role.name,
                            chunk: event.content
                        });
                    } else if (event.type === 'tool_call') {
                        toolCalls.push(event);
                    }
                }

                // If we got tool calls, we must execute them and continue the loop
                if (toolCalls.length > 0) {
                    // Append the assistant's thought process (if any text before tool call) to history
                    currentMessages.push({
                        role: 'assistant',
                        content: accumulatedResponse,
                        tool_calls: toolCalls.map(tc => ({
                            type: 'function',
                            function: {
                                name: tc.toolName,
                                arguments: tc.args
                            }
                        }))
                    });

                    for (const call of toolCalls) {
                        // Emit BEFORE_TOOL_CALL for hooks
                        this.eventBus.emit(EventTypes.BEFORE_TOOL_CALL, {
                            experimentId: this.experiment._id,
                            toolName: call.toolName,
                            args: call.args
                        });

                        this.eventBus.emit(EventTypes.TOOL_CALL, {
                            experimentId: this.experiment._id,
                            toolName: call.toolName,
                            args: call.args
                        });

                        // 1. Acquire Container
                        const container = await ContainerPoolManager.getInstance().acquire();

                        // 2. Resolve Tool Code
                        const toolDoc = await Tool.findOne({ name: call.toolName });
                        if (!toolDoc) {
                            throw new Error(`Tool detected but not found in DB: ${call.toolName}`);
                        }

                        let result = '';
                        let error = null;

                        try {
                            // 3. Execute
                            const execResult = await container.execute(
                                toolDoc.code,
                                filteredEnv.variables, // Pass the environment
                                call.args
                            );

                            // 4. Handle Result
                            try {
                                const jsonOutput = JSON.parse(execResult.stdout);
                                // Merge into environment
                                Object.assign(this.experiment.currentEnvironment.variables, jsonOutput);
                                // Also update our local filtered copy for the next loop iteration visibility?
                                Object.assign(filteredEnv.variables, jsonOutput);
                                result = jsonOutput;
                            } catch (parseErr) {
                                result = execResult.stdout;
                            }

                            if (execResult.exitCode !== 0) {
                                error = execResult.stderr || 'Unknown error';
                            }
                        } catch (err) {
                            error = err.message;
                        } finally {
                            // 5. Cleanup
                            await container.destroy(); // One-shot
                        }

                        this.eventBus.emit(EventTypes.TOOL_RESULT, {
                            experimentId: this.experiment._id,
                            toolName: call.toolName,
                            result: error ? { error } : result,
                            envChanges: result // Simplified
                        });

                        // Append Tool Result to History
                        currentMessages.push({
                            role: 'tool',
                            name: call.toolName,
                            content: error ? `Error: ${error}` : (typeof result === 'string' ? result : JSON.stringify(result))
                        });

                        // Emit AFTER_TOOL_CALL for hooks
                        this.eventBus.emit(EventTypes.AFTER_TOOL_CALL, {
                            experimentId: this.experiment._id,
                            toolName: call.toolName,
                            result: error ? { error } : result
                        });
                    }

                    shouldContinue = true; // Continue the conversation loop
                    loopCount++;
                } else {
                    // No tool calls, just normal completion
                    this.eventBus.emit(EventTypes.MODEL_RESPONSE_COMPLETE, {
                        experimentId: this.experiment._id,
                        roleName: role.name,
                        fullResponse: accumulatedResponse
                    });
                }

            } catch (err) {
                this.eventBus.emit(EventTypes.LOG, {
                    experimentId: this.experiment._id,
                    stepNumber: this.experiment.currentStep,
                    source: 'SYSTEM',
                    message: `Inference failed: ${err.message}`,
                    data: { error: err }
                });
                shouldContinue = false;
            }
        }
    }

    /**
     * Evaluates goals to see if experiment should terminate.
     * @returns {Promise<string|null>} Description of met goal, or null.
     */
    async evaluateGoals() {
        if (!this.plan.goals || this.plan.goals.length === 0) return null;

        for (const goal of this.plan.goals) {
            let container = null;
            try {
                // Acquire container
                container = await ContainerPoolManager.getInstance().acquire();

                const envJson = JSON.stringify(this.experiment.currentEnvironment.variables);
                const condition = goal.conditionScript;

                // Python script to evaluate the condition safely using env vars
                const pythonScript = `
import os
import json
import sys

try:
    env_str = os.environ.get('EXPERIMENT_ENV', '{}')
    env = json.loads(env_str)
    condition = os.environ.get('GOAL_CONDITION', 'False')
    
    # Evaluate locally using env as the variable scope
    result = eval(condition, {}, env)
    
    print(json.dumps({'result': result}))
except Exception as e:
    print(json.dumps({'error': str(e)}))
`;

                // Execute in container using simplified interface
                const execResult = await container.execute(
                    pythonScript, // The script to run
                    {
                        EXPERIMENT_ENV: envJson,
                        GOAL_CONDITION: condition
                    }, // Environment variables
                    [] // Args
                );

                if (execResult.exitCode !== 0) {
                    // If python crashed without printing JSON
                    throw new Error(execResult.stderr || `Goal evaluation process failed with exit code ${execResult.exitCode}`);
                }

                // Parse output
                let output;
                try {
                    output = JSON.parse(execResult.stdout);
                } catch (parseErr) {
                    throw new Error(`Failed to parse goal evaluation output: ${execResult.stdout}`);
                }

                if (output.error) {
                    throw new Error(output.error);
                }

                if (output.result === true) {
                    return goal.description;
                }

            } catch (e) {
                this.eventBus.emit(EventTypes.LOG, {
                    experimentId: this.experiment._id,
                    stepNumber: this.experiment.currentStep,
                    source: 'SYSTEM',
                    message: `Goal evaluation failed for goal ${goal.description}: ${e.message}`,
                    data: { error: e.message }
                });
                throw e; // Fail the experiment if goal eval is broken
            } finally {
                if (container) {
                    await container.destroy();
                }
            }
        }
        return null;
    }

    /**
     * Handles a hook event by executing the associated script.
     * @param {Object} script - The script object from the plan
     * @param {Object} eventPayload - The event payload that triggered the hook
     */
    async _handleHookEvent(script, eventPayload) {
        if (script.executionMode === 'ASYNC') {
            // Fire and forget for async
            this.executeHook(script, eventPayload).catch(err => {
                this.eventBus.emit(EventTypes.LOG, {
                    experimentId: this.experiment?._id,
                    stepNumber: this.experiment?.currentStep,
                    source: 'HOOK',
                    message: `Async hook failed: ${err.message}`,
                    data: { hookType: script.hookType, error: err.message }
                });
            });
        } else {
            // SYNC - await completion
            await this.executeHook(script, eventPayload);
        }
    }

    /**
     * Executes a hook script in a container.
     * @param {Object} script - The script object containing code, failPolicy, etc.
     * @param {Object} eventPayload - The event payload
     * @returns {Promise<void>}
     */
    async executeHook(script, eventPayload) {
        let container = null;
        try {
            container = await ContainerPoolManager.getInstance().acquire();

            // Construct Context
            const context = {
                experiment: {
                    id: this.experiment._id.toString(),
                    planId: this.experiment.planId.toString(),
                    status: this.experiment.status,
                    currentStep: this.experiment.currentStep
                },
                environment: deepCopy(this.experiment.currentEnvironment),
                event: eventPayload
            };

            const contextJson = JSON.stringify(context);

            // Python wrapper that loads context, executes user code, and outputs modified environment
            const pythonScript = `
import os
import json
import sys

try:
    context_str = os.environ.get('HOOK_CONTEXT', '{}')
    context = json.loads(context_str)
    
    experiment = context.get('experiment', {})
    env = context.get('environment', {}).get('variables', {})
    event = context.get('event', {})
    
    # User code has access to: experiment, env, event
    # User code can modify 'env' dict
    user_code = os.environ.get('HOOK_CODE', '')
    exec(user_code)
    
    # Output modified environment
    print(json.dumps({'success': True, 'environment': env}))
except Exception as e:
    print(json.dumps({'success': False, 'error': str(e)}))
`;

            const execResult = await container.execute(
                pythonScript,
                {
                    HOOK_CONTEXT: contextJson,
                    HOOK_CODE: script.code
                },
                []
            );

            // Log script output
            this.eventBus.emit(EventTypes.LOG, {
                experimentId: this.experiment._id,
                stepNumber: this.experiment.currentStep,
                source: 'HOOK',
                message: `Hook ${script.hookType} executed`,
                data: { stdout: execResult.stdout, stderr: execResult.stderr }
            });

            if (execResult.exitCode !== 0) {
                throw new Error(execResult.stderr || `Hook process failed with exit code ${execResult.exitCode}`);
            }

            // Parse output
            let output;
            try {
                output = JSON.parse(execResult.stdout);
            } catch (parseErr) {
                throw new Error(`Failed to parse hook output: ${execResult.stdout}`);
            }

            if (!output.success) {
                throw new Error(output.error || 'Unknown hook error');
            }

            // Merge environment changes back
            if (output.environment) {
                Object.assign(this.experiment.currentEnvironment.variables, output.environment);
            }

        } catch (e) {
            this.eventBus.emit(EventTypes.LOG, {
                experimentId: this.experiment._id,
                stepNumber: this.experiment.currentStep,
                source: 'HOOK',
                message: `Hook ${script.hookType} failed: ${e.message}`,
                data: { error: e.message, failPolicy: script.failPolicy }
            });

            if (script.failPolicy === 'ABORT_EXPERIMENT') {
                throw e; // Re-throw to abort the experiment
            }
            // CONTINUE_WITH_ERROR - just log and continue (already logged above)
        } finally {
            if (container) {
                await container.destroy();
            }
        }
    }

    /**
     * Expose internal event bus emit for testing or external triggers.
     */
    emit(responseEvent, payload) {
        this.eventBus.emit(responseEvent, payload);
    }
}

module.exports = { ExperimentOrchestrator };
