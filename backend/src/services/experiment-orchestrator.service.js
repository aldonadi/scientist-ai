const { EventBus, EventTypes } = require('./event-bus');
const { Experiment } = require('../models/experiment.model');
const { ExperimentPlan } = require('../models/experimentPlan.model');
const Tool = require('../models/tool.model');
const { Provider } = require('../models/provider.model');
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

        // Control flow state for script actions
        this._controlFlow = {
            stopExperiment: null,    // { success: bool, message: string } or null
            pauseExperiment: false,
            skipRole: false,
            endStep: null,           // { immediate: bool } or null
            pendingLogs: [],         // [{ message, data }]
            pendingMessages: []      // [{ roleName, content }]
        };
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
                this.experiment.markModified('currentEnvironment');
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

        await this.eventBus.emitAsync(EventTypes.EXPERIMENT_START, {
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

                // Check for script-triggered stop
                if (this._controlFlow.stopExperiment) {
                    const stopInfo = this._controlFlow.stopExperiment;
                    this.experiment.status = stopInfo.success ? 'COMPLETED' : 'FAILED';
                    this.experiment.result = stopInfo.message || (stopInfo.success ? 'Stopped by script (success)' : 'Stopped by script (failure)');
                    this.experiment.endTime = new Date();
                    const duration = this.experiment.endTime - this.experiment.startTime;

                    await this.experiment.save();
                    await this.eventBus.emitAsync(EventTypes.EXPERIMENT_END, {
                        experimentId: this.experiment._id,
                        result: this.experiment.result,
                        duration: duration
                    });
                    return;
                }

                // Check for script-triggered pause
                if (this._controlFlow.pauseExperiment) {
                    this.experiment.status = 'PAUSED';
                    await this.experiment.save();
                    this.eventBus.emit(EventTypes.LOG, {
                        experimentId: this.experiment._id,
                        stepNumber: this.experiment.currentStep,
                        source: 'SYSTEM',
                        message: 'Experiment paused by script action'
                    });
                    return;
                }

                // Goal Evaluation
                const goalMet = await this.evaluateGoals();
                if (goalMet) {
                    this.experiment.status = 'COMPLETED';
                    this.experiment.result = goalMet;
                    this.experiment.endTime = new Date();
                    const duration = this.experiment.endTime - this.experiment.startTime;

                    await this.experiment.save();
                    await this.eventBus.emitAsync(EventTypes.EXPERIMENT_END, {
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
                    await this.eventBus.emitAsync(EventTypes.EXPERIMENT_END, {
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

                await this.eventBus.emitAsync(EventTypes.EXPERIMENT_END, {
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
     * @returns {Promise<boolean>} True if step should continue to next, false if experiment flow interrupted
     */
    async processStep() {
        const step = this.experiment.currentStep;

        // Reset per-step control flow state
        this._controlFlow.endStep = null;
        this._controlFlow.skipRole = false;

        await this.eventBus.emitAsync(EventTypes.STEP_START, {
            experimentId: this.experiment._id,
            stepNumber: step
        });

        // Check if STEP_START hook requested stop or immediate end
        if (this._controlFlow.stopExperiment || this._controlFlow.pauseExperiment) {
            return false; // Let runLoop handle the stop/pause
        }
        if (this._controlFlow.endStep?.immediate) {
            this.eventBus.emit(EventTypes.LOG, {
                experimentId: this.experiment._id,
                stepNumber: step,
                source: 'SYSTEM',
                message: 'Step ending immediately due to script action'
            });
            // Skip roles, go directly to STEP_END
            await this.eventBus.emitAsync(EventTypes.STEP_END, {
                experimentId: this.experiment._id,
                stepNumber: step,
                environmentSnapshot: this.experiment.currentEnvironment
            });
            return true;
        }

        // Role Iteration
        for (const role of this.plan.roles) {
            await this.processRole(role);

            // Check if we should end the step early (non-immediate mode waits for current role)
            if (this._controlFlow.endStep) {
                this.eventBus.emit(EventTypes.LOG, {
                    experimentId: this.experiment._id,
                    stepNumber: step,
                    source: 'SYSTEM',
                    message: 'Step ending early after current role due to script action'
                });
                break;
            }

            // Check if we should stop/pause the experiment
            if (this._controlFlow.stopExperiment || this._controlFlow.pauseExperiment) {
                break;
            }
        }

        await this.eventBus.emitAsync(EventTypes.STEP_END, {
            experimentId: this.experiment._id,
            stepNumber: step,
            environmentSnapshot: this.experiment.currentEnvironment
        });

        return !this._controlFlow.stopExperiment && !this._controlFlow.pauseExperiment;
    }

    /**
     * Processing for a single role.
     * Constructs the prompt, resolves tools, and emits the MODEL_PROMPT event.
     */
    async processRole(role) {
        // Reset skipRole flag before emitting ROLE_START
        this._controlFlow.skipRole = false;

        await this.eventBus.emitAsync(EventTypes.ROLE_START, {
            experimentId: this.experiment._id,
            roleName: role.name
        });

        // Check if ROLE_START hook requested to skip this role
        if (this._controlFlow.skipRole) {
            this.eventBus.emit(EventTypes.LOG, {
                experimentId: this.experiment._id,
                stepNumber: this.experiment.currentStep,
                source: 'SYSTEM',
                message: `Role "${role.name}" skipped due to script action`
            });
            return;
        }

        // Check if we should stop/pause (higher priority than role processing)
        if (this._controlFlow.stopExperiment || this._controlFlow.pauseExperiment) {
            return;
        }

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
        // 3. Prompt Construction & History Retrieval
        // Ensure roleHistory map exists
        if (!this.experiment.roleHistory) {
            this.experiment.roleHistory = new Map();
        }

        // Get or initialize history for this role
        // Note: We use .get() usually, but with Mongoose Maps sometimes direct access or .get() works.
        // We'll use .get() ensuring we handle the potentially undefined return.
        let roleHistory = this.experiment.roleHistory.get(role.name);
        if (!roleHistory) {
            roleHistory = [];
            this.experiment.roleHistory.set(role.name, roleHistory);
        }

        const step = this.experiment.currentStep;

        // The new User input for this step
        const newUserMessage = {
            role: 'user',
            content: `Step ${step}. Current Environment: ${JSON.stringify(filteredEnv.variables)}`
        };

        // Construct full message history: System Prompt + Past History + New User Message
        // We do NOT include the System Prompt in the stored history, as we prepend it fresh each time.
        const messages = [
            {
                role: 'system',
                content: role.systemPrompt
            },
            ...roleHistory,
            newUserMessage
        ];

        // Debug logging: Show exact prompt being sent to LLM
        const debugInfo = {
            fullPrompt: messages.map(m => `[${m.role.toUpperCase()}] ${m.content}`).join('\n\n'),
            variableWhitelist: whitelist || '(none - showing all)',
            filteredVariables: Object.keys(filteredEnv.variables),
            allVariables: Object.keys(fullEnv.variables),
            toolCount: toolsForProvider.length
        };

        console.log('\n' + '='.repeat(80));
        console.log(`[DEBUG] PROMPT FOR ROLE: ${role.name}`);
        console.log('='.repeat(80));
        console.log(`Whitelist: ${JSON.stringify(whitelist || 'ALL')}`);
        console.log(`Filtered vars: ${debugInfo.filteredVariables.join(', ') || '(none)'}`);
        console.log(`All available vars: ${debugInfo.allVariables.join(', ')}`);
        console.log('-'.repeat(80));
        console.log(debugInfo.fullPrompt);
        console.log('='.repeat(80) + '\n');

        this.eventBus.emit(EventTypes.LOG, {
            experimentId: this.experiment._id,
            stepNumber: this.experiment.currentStep,
            source: 'SYSTEM',
            message: `[DEBUG] Sending prompt to ${role.name}`,
            data: debugInfo
        });


        // 4. Emit MODEL_PROMPT
        // Hooks can listen to this and modify 'messages' if needed.
        await this.eventBus.emitAsync(EventTypes.MODEL_PROMPT, {
            experimentId: this.experiment._id,
            roleName: role.name,
            messages: messages,
            tools: toolsForProvider
        });


        // 5. Inference & Tool Execution Loop
        const ProviderService = require('./provider/provider.service');
        // ContainerPoolManager imported at top-level

        // Track if we should continue the turn based on tool configurations
        let shouldContinue = false;
        let accumulatedResponse = '';
        let currentMessages = [...messages];
        let toolCalls = [];

        // Safety limit for tool loops to prevent infinite recursions
        let loopCount = 0;
        const MAX_TOOL_LOOPS = 5;

        // Default to stop unless tool call forces continuance
        // We start with shouldContinue = true to enter the loop, but reset it inside?
        // Actually, the loop condition is checked at start.
        // We need to enter the loop at least once. 
        // Let's use a do-while or set shouldContinue = true initially.
        shouldContinue = true;

        while (shouldContinue && loopCount < MAX_TOOL_LOOPS) {
            shouldContinue = false; // Default to stop after this iteration unless a tool says "continue"
            accumulatedResponse = '';
            let accumulatedThinking = '';
            toolCalls = [];

            // We need to resolve the Provider configuration from the DB
            // role.modelConfig.provider is an ObjectId reference
            const providerDoc = await Provider.findById(role.modelConfig.provider);
            if (!providerDoc) {
                // If the provider ID is missing (e.g. from bad seeding or deletion), we can't proceed.
                // Log and break?
                throw new Error(`Provider not found with ID: ${role.modelConfig.provider}`);
            }

            const providerConfig = {
                type: providerDoc.type,
                baseUrl: providerDoc.baseUrl,
                apiKey: providerDoc.apiKeyRef ? process.env[providerDoc.apiKeyRef] : undefined
            };

            const modelName = role.modelConfig ? role.modelConfig.modelName : 'llama3';

            const maxRetries = this.plan.maxStepRetries || 3;
            let retryCount = 0;
            let success = false;
            let stream = null;

            while (!success && retryCount <= maxRetries) {
                try {
                    stream = await ProviderService.chat(
                        providerConfig,
                        modelName,
                        [...currentMessages],
                        toolsForProvider,
                        { temperature: role.modelConfig?.temperature || 0.7 }
                    );
                    success = true;
                } catch (chatErr) {
                    retryCount++;
                    this.eventBus.emit(EventTypes.LOG, {
                        experimentId: this.experiment._id,
                        stepNumber: this.experiment.currentStep,
                        source: 'SYSTEM',
                        message: `Inference attempt ${retryCount}/${maxRetries + 1} failed: ${chatErr.message}`,
                        data: { error: chatErr.message }
                    });

                    if (retryCount > maxRetries) {
                        // Stop the loop completely
                        shouldContinue = false;
                        // Throw a special error that the outer loop catches to stop the role?
                        // Or just let the outer logic handle 'shouldContinue = false'.
                        // If we just break, 'stream' is null.
                        break;
                    }

                    // Simple backoff wait (1s * retryCount)
                    await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
                }
            }

            if (!success || !stream) {
                shouldContinue = false;
                // Don't throw, just log (already logged failure) and stop role.
                // This effectively "skips" the rest of the role logic if inference fails.
                // If critical failure is desired, we should throw.
                // User said: "halt the experiment after max retries".
                // So we SHOULD throw.
                throw new Error(`Inference failed after ${maxRetries} retries.`);
            }

            try {
                for await (const event of stream) {
                    if (event.type === 'text') {
                        accumulatedResponse += event.content;
                        this.eventBus.emit(EventTypes.MODEL_RESPONSE_CHUNK, {
                            experimentId: this.experiment._id,
                            roleName: role.name,
                            chunk: event.content
                        });
                    } else if (event.type === 'thinking') {
                        accumulatedThinking += event.content;
                        // Optional idea: Emit THINKING_CHUNK event if we want live updates of thoughts
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
                        thinking: accumulatedThinking || undefined,
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
                        await this.eventBus.emitAsync(EventTypes.BEFORE_TOOL_CALL, {
                            experimentId: this.experiment._id,
                            toolName: call.toolName,
                            args: call.args
                        });

                        await this.eventBus.emitAsync(EventTypes.TOOL_CALL, {
                            experimentId: this.experiment._id,
                            toolName: call.toolName,
                            args: call.args
                        });

                        // Log tool call for UI visibility
                        this.eventBus.emit(EventTypes.LOG, {
                            experimentId: this.experiment._id,
                            stepNumber: this.experiment.currentStep,
                            source: 'TOOL',
                            message: `Calling tool: ${call.toolName}`,
                            data: { arguments: call.args }
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

                        // Create Python wrapper that calls the tool's execute() function
                        // and outputs the modified environment as JSON
                        const toolWrapper = `
import os
import json
import sys
import traceback

try:
    # Load environment and arguments from env vars
    env_str = os.environ.get('TOOL_ENV', '{}')
    args_str = os.environ.get('TOOL_ARGS', '{}')
    
    env = json.loads(env_str)
    args = json.loads(args_str) if args_str else {}
    
    # User tool code - defines execute(env, args)
    user_code = os.environ.get('TOOL_CODE', '')
    
    # Create namespace for exec
    exec_namespace = {
        'os': os,
        'json': json,
        'sys': sys
    }
    
    # Execute tool code to define execute() function
    exec(user_code, exec_namespace)
    
    # Call the execute function
    result = None
    if 'execute' in exec_namespace and callable(exec_namespace['execute']):
        result = exec_namespace['execute'](env, args)
    else:
        raise Exception("Tool code must define an execute(env, args) function")
    
    # Output modified environment and result as JSON
    print(json.dumps({
        'success': True,
        'environment': env,
        'result': result if result is not None else ''
    }))
except Exception as e:
    traceback.print_exc()
    print(json.dumps({'success': False, 'error': str(e)}))
`;

                        try {
                            // 3. Execute with wrapper
                            const execResult = await container.execute(
                                toolWrapper,
                                {
                                    TOOL_ENV: JSON.stringify(this.experiment.currentEnvironment.variables),
                                    TOOL_ARGS: JSON.stringify(call.args || {}),
                                    TOOL_CODE: toolDoc.code
                                },
                                []
                            );

                            // 4. Handle Result
                            try {
                                const jsonOutput = JSON.parse(execResult.stdout);

                                if (!jsonOutput.success) {
                                    throw new Error(jsonOutput.error || 'Tool execution failed');
                                }

                                // Merge environment changes from tool
                                if (jsonOutput.environment) {
                                    Object.assign(this.experiment.currentEnvironment.variables, jsonOutput.environment);
                                    this.experiment.markModified('currentEnvironment');
                                    // Also update our local filtered copy
                                    Object.assign(filteredEnv.variables, jsonOutput.environment);
                                }
                                result = jsonOutput.result || jsonOutput.environment;
                            } catch (parseErr) {
                                // Log that tool didn't return valid JSON
                                this.eventBus.emit(EventTypes.LOG, {
                                    experimentId: this.experiment._id,
                                    stepNumber: this.experiment.currentStep,
                                    source: 'TOOL',
                                    message: `Tool ${call.toolName} did not return valid JSON - environment not updated`,
                                    data: {
                                        rawOutput: execResult.stdout,
                                        stderr: execResult.stderr,
                                        parseError: parseErr.message
                                    }
                                });
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

                        await this.eventBus.emitAsync(EventTypes.TOOL_RESULT, {
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
                        await this.eventBus.emitAsync(EventTypes.AFTER_TOOL_CALL, {
                            experimentId: this.experiment._id,
                            toolName: call.toolName,
                            result: error ? { error } : result
                        });

                        // Check if this tool forces the turn to end
                        // Default behavior: endsTurn = true (or undefined)
                        if (toolDoc.endsTurn !== false) {
                            // If ANY tool ends the turn, we stop.
                            // But wait, the variable 'shouldContinue' controls the NEXT iteration.
                            // If we want to continue, we need ALL tools to be non-ending?
                            // Or if ANY tool allows continuation?
                            // Logic: "give the Role the opportunity to continue calling more tools UNTIL it calls a tool that ends the turn."
                            // So if a tool ends the turn, we stop. 
                            // If we have previously set shouldContinue = true (from a previous tool in this batch?), 
                            // a subsequent tool that ends the turn should flip it back to false.
                            // So we need to track if we *can* continue.
                        }
                    }

                    // Determine if we should continue
                    // We continue ONLY if ALL tools executing in this batch allow continuation
                    // (i.e. endsTurn === false). If ANY tool has endsTurn === true, we stop.
                    // However, we need to be careful: if we have mixed tools, safeguard says stop.

                    // We need to re-iterate or track it during execution.
                    // Let's assume we tracked it.
                    let allToolsAllowContinue = true;
                    for (const call of toolCalls) {
                        const toolDoc = await Tool.findOne({ name: call.toolName });
                        if (toolDoc && toolDoc.endsTurn !== false) {
                            allToolsAllowContinue = false;
                            break;
                        }
                    }

                    if (allToolsAllowContinue) {
                        shouldContinue = true;
                    } else {
                        shouldContinue = false;
                    }

                    loopCount++;
                } else {
                    // No tool calls, just normal completion
                    await this.eventBus.emitAsync(EventTypes.MODEL_RESPONSE_COMPLETE, {
                        experimentId: this.experiment._id,
                        roleName: role.name,
                        fullResponse: accumulatedResponse
                    });

                    // Add final response to history
                    currentMessages.push({
                        role: 'assistant',
                        content: accumulatedResponse,
                        thinking: accumulatedThinking || undefined
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

        // 6. Persist History
        // We append the new interactions from this turn to the persistent history.
        // currentMessages = [System, ...OldHistory, NewUser, ...NewResponses]
        // We want to capture [NewUser, ...NewResponses]
        // The number of pre-existing items is 1 (System) + roleHistory.length (OldHistory)
        const newHistoryItems = currentMessages.slice(1 + roleHistory.length);

        if (newHistoryItems.length > 0) {
            roleHistory.push(...newHistoryItems);
            // Mark modified to ensure Mongoose saves the Map change
            this.experiment.markModified('roleHistory');
            await this.experiment.save();
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
    env_dict = json.loads(env_str)
    
    class DotDict(dict):
        def __getattr__(self, key):
            if key not in self:
                raise AttributeError(key)
            return self[key]

    # Recursive conversion for dot notation while keeping dict methods
    def to_dot_dict(d):
        if isinstance(d, dict):
            return DotDict({k: to_dot_dict(v) for k, v in d.items()})
        return d

    env = to_dot_dict(env_dict)
    condition = os.environ.get('GOAL_CONDITION', 'False')
    
    # Evaluate locally using env object in scope
    result = eval(condition, {}, {'env': env})
    
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

            // Build hook-specific context based on hook type
            const hookContext = this._buildHookContext(script.hookType, eventPayload);

            // Construct Context with new 'hook' field
            const context = {
                experiment: {
                    id: this.experiment._id.toString(),
                    planId: this.experiment.planId.toString(),
                    status: this.experiment.status,
                    currentStep: this.experiment.currentStep
                },
                environment: JSON.parse(JSON.stringify(this.experiment.currentEnvironment.variables)),
                event: eventPayload,
                hook: hookContext
            };

            const contextJson = JSON.stringify(context);

            // Python wrapper with Actions class and hook context support
            const pythonScript = `
import os
import json
import sys
import traceback

try:
    # Helper for dot notation access - IMPORTANT: converts nested dicts IN-PLACE
    class DotDict(dict):
        def __getattr__(self, key):
            if key not in self:
                raise AttributeError(key)
            val = self[key]
            # Convert nested dict IN-PLACE to DotDict so mutations are reflected
            if isinstance(val, dict) and not isinstance(val, DotDict):
                val = DotDict(val)
                self[key] = val  # Store the converted version back!
            return val
        
        def __setattr__(self, key, value):
            self[key] = value

    # Actions API for scripts to control experiment flow
    class Actions:
        _pending = []
        
        @staticmethod
        def stop_experiment(success=False, message=None):
            """Stop the experiment as SUCCESS or FAILURE"""
            Actions._pending.append({
                'type': 'STOP_EXPERIMENT',
                'success': success,
                'message': message
            })
        
        @staticmethod
        def pause_experiment():
            """Pause the experiment (can be resumed via control API)"""
            Actions._pending.append({
                'type': 'PAUSE_EXPERIMENT'
            })
        
        @staticmethod
        def log(message, data=None):
            """Write an arbitrary log entry"""
            Actions._pending.append({
                'type': 'LOG',
                'message': str(message),
                'data': data
            })
        
        @staticmethod
        def end_step(immediate=False):
            """End the current step early"""
            Actions._pending.append({
                'type': 'END_STEP',
                'immediate': immediate
            })
        
        @staticmethod
        def skip_role():
            """Skip the current role and move to the next"""
            Actions._pending.append({
                'type': 'SKIP_ROLE'
            })
        
        @staticmethod
        def set_variable(key, value):
            """Set an environment variable (syntactic sugar)"""
            Actions._pending.append({
                'type': 'SET_VARIABLE',
                'key': key,
                'value': value
            })
        
        @staticmethod
        def inject_message(role_name, content):
            """Inject a message into a role's conversation history"""
            Actions._pending.append({
                'type': 'INJECT_MESSAGE',
                'role_name': role_name,
                'content': content
            })
        
        @staticmethod
        def query_llm(prompt, system_prompt=None, model=None):
            """
            Query the LLM and get a response (blocking).
            Note: This is handled specially and executes synchronously.
            """
            Actions._pending.append({
                'type': 'QUERY_LLM',
                'prompt': prompt,
                'system_prompt': system_prompt,
                'model': model
            })
            # Note: Actual LLM response is not available in this version
            # The orchestrator will process this after script completes
            return "[LLM query will be processed by orchestrator]"

    actions = Actions()

    # Interactive context for top-level code
    context_str = os.environ.get('HOOK_CONTEXT', '{}')
    context_dict = json.loads(context_str)
    
    # Create a robust context object with dot notation
    context = DotDict(context_dict)
    
    # For backward compatibility with top-level scripts
    experiment = context_dict.get('experiment', {})
    env = context_dict.get('environment', {})
    event = context_dict.get('event', {})
    hook = DotDict(context_dict.get('hook', {}))
    
    user_code = os.environ.get('HOOK_CODE', '')
    
    # Create a namespace for exec - this is CRITICAL for capturing user-defined functions
    exec_namespace = {
        'context': context,
        'experiment': experiment,
        'env': env,
        'event': event,
        'hook': hook,
        'actions': actions,
        'Actions': Actions,
        'os': os,
        'json': json,
        'sys': sys
    }
    
    # Execute the user code in the shared namespace
    exec(user_code, exec_namespace)
    
    # Check if a 'run' function was defined in the exec namespace and call it
    if 'run' in exec_namespace and callable(exec_namespace['run']):
        exec_namespace['run'](context)
        
        # Sync changes back from context['environment'] to our 'env' local
        if 'environment' in context:
            env = context['environment']
            if isinstance(env, DotDict):
                env = dict(env)  # Convert back to regular dict for JSON serialization
            
    # Output modified environment AND pending actions
    print(json.dumps({
        'success': True, 
        'environment': env,
        'actions': Actions._pending
    }))
except Exception as e:
    traceback.print_exc()
    print(json.dumps({'success': False, 'error': str(e), 'actions': []}))
`;

            const execResult = await container.execute(
                pythonScript,
                {
                    HOOK_CONTEXT: contextJson,
                    HOOK_CODE: script.code
                },
                []
            );

            // Log script output (but not overly verbose)
            if (execResult.stderr) {
                this.eventBus.emit(EventTypes.LOG, {
                    experimentId: this.experiment._id,
                    stepNumber: this.experiment.currentStep,
                    source: 'HOOK',
                    message: `Hook ${script.hookType} stderr output`,
                    data: { stderr: execResult.stderr }
                });
            }

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
                this.experiment.markModified('currentEnvironment');
            }

            // Process any actions from the script
            if (output.actions && output.actions.length > 0) {
                this._processScriptActions(output.actions, script.hookType);
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
     * Builds hook-specific context based on the event type.
     * @param {string} hookType - The type of hook
     * @param {Object} eventPayload - The event payload
     * @returns {Object} Hook-specific context
     */
    _buildHookContext(hookType, eventPayload) {
        const baseContext = { type: hookType };

        switch (hookType) {
            case 'EXPERIMENT_START':
                return {
                    ...baseContext,
                    experiment_id: eventPayload.experimentId?.toString(),
                    plan_name: eventPayload.planName
                };

            case 'STEP_START':
            case 'STEP_END':
                return {
                    ...baseContext,
                    step_number: eventPayload.stepNumber,
                    environment_snapshot: hookType === 'STEP_END' ? eventPayload.environmentSnapshot : undefined
                };

            case 'ROLE_START':
                return {
                    ...baseContext,
                    role_name: eventPayload.roleName
                };

            case 'MODEL_PROMPT':
                return {
                    ...baseContext,
                    role_name: eventPayload.roleName,
                    messages: eventPayload.messages,
                    tools: eventPayload.tools
                };

            case 'MODEL_RESPONSE_CHUNK':
                return {
                    ...baseContext,
                    role_name: eventPayload.roleName,
                    chunk: eventPayload.chunk
                };

            case 'MODEL_RESPONSE_COMPLETE':
                return {
                    ...baseContext,
                    role_name: eventPayload.roleName,
                    full_response: eventPayload.fullResponse
                };

            case 'BEFORE_TOOL_CALL':
            case 'TOOL_CALL':
                return {
                    ...baseContext,
                    tool_name: eventPayload.toolName,
                    args: eventPayload.args
                };

            case 'TOOL_RESULT':
            case 'AFTER_TOOL_CALL':
                return {
                    ...baseContext,
                    tool_name: eventPayload.toolName,
                    result: eventPayload.result,
                    env_changes: eventPayload.envChanges
                };

            case 'EXPERIMENT_END':
                return {
                    ...baseContext,
                    result: eventPayload.result,
                    duration: eventPayload.duration
                };

            default:
                return baseContext;
        }
    }

    /**
     * Processes actions returned by a script execution.
     * Updates control flow state and handles immediate actions.
     * @param {Array} actions - Array of action objects from script
     * @param {string} hookType - The hook type that generated these actions
     */
    _processScriptActions(actions, hookType) {
        for (const action of actions) {
            switch (action.type) {
                case 'STOP_EXPERIMENT':
                    this._controlFlow.stopExperiment = {
                        success: action.success || false,
                        message: action.message || (action.success ? 'Stopped by script' : 'Failed by script')
                    };
                    this.eventBus.emit(EventTypes.LOG, {
                        experimentId: this.experiment._id,
                        stepNumber: this.experiment.currentStep,
                        source: 'SCRIPT',
                        message: `Script requested experiment ${action.success ? 'SUCCESS' : 'FAILURE'}: ${action.message || 'No message'}`
                    });
                    break;

                case 'PAUSE_EXPERIMENT':
                    this._controlFlow.pauseExperiment = true;
                    this.eventBus.emit(EventTypes.LOG, {
                        experimentId: this.experiment._id,
                        stepNumber: this.experiment.currentStep,
                        source: 'SCRIPT',
                        message: 'Script requested experiment pause'
                    });
                    break;

                case 'LOG':
                    this.eventBus.emit(EventTypes.LOG, {
                        experimentId: this.experiment._id,
                        stepNumber: this.experiment.currentStep,
                        source: 'SCRIPT',
                        message: action.message,
                        data: action.data
                    });
                    break;

                case 'END_STEP':
                    // Prevent infinite loop: don't process END_STEP during STEP_END hook
                    if (hookType === 'STEP_END') {
                        this.eventBus.emit(EventTypes.LOG, {
                            experimentId: this.experiment._id,
                            stepNumber: this.experiment.currentStep,
                            source: 'SCRIPT',
                            message: 'Warning: end_step() called in STEP_END hook - ignored to prevent infinite loop'
                        });
                        break;
                    }
                    this._controlFlow.endStep = { immediate: action.immediate || false };
                    this.eventBus.emit(EventTypes.LOG, {
                        experimentId: this.experiment._id,
                        stepNumber: this.experiment.currentStep,
                        source: 'SCRIPT',
                        message: `Script requested end step${action.immediate ? ' (immediate)' : ''}`
                    });
                    break;

                case 'SKIP_ROLE':
                    this._controlFlow.skipRole = true;
                    // Logging will happen in processRole when we check this flag
                    break;

                case 'SET_VARIABLE':
                    if (action.key) {
                        this.experiment.currentEnvironment.variables[action.key] = action.value;
                        this.experiment.markModified('currentEnvironment');
                    }
                    break;

                case 'INJECT_MESSAGE':
                    this._controlFlow.pendingMessages.push({
                        roleName: action.role_name,
                        content: action.content
                    });
                    break;

                case 'QUERY_LLM':
                    // TODO: Implement blocking LLM query
                    // For now, log that this feature is not yet fully implemented
                    this.eventBus.emit(EventTypes.LOG, {
                        experimentId: this.experiment._id,
                        stepNumber: this.experiment.currentStep,
                        source: 'SCRIPT',
                        message: 'LLM query requested but synchronous response not yet implemented',
                        data: { prompt: action.prompt, model: action.model }
                    });
                    break;

                default:
                    this.eventBus.emit(EventTypes.LOG, {
                        experimentId: this.experiment._id,
                        stepNumber: this.experiment.currentStep,
                        source: 'SCRIPT',
                        message: `Unknown action type: ${action.type}`
                    });
            }
        }
    }

    /**
     * Resets control flow state. Should be called at appropriate points in the lifecycle.
     */
    _resetControlFlow() {
        this._controlFlow = {
            stopExperiment: null,
            pauseExperiment: false,
            skipRole: false,
            endStep: null,
            pendingLogs: [],
            pendingMessages: []
        };
    }

    /**
     * Expose internal event bus emit for testing or external triggers.
     */
    emit(responseEvent, payload) {
        this.eventBus.emit(responseEvent, payload);
    }
}

module.exports = { ExperimentOrchestrator };
