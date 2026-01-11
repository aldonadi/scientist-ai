const { EventBus, EventTypes } = require('./event-bus');
const { Experiment } = require('../models/experiment.model');
const { ExperimentPlan } = require('../models/experimentPlan.model');
const Tool = require('../models/tool.model');
const { deepCopy } = require('../models/schemas/environment.schema');
const Logger = require('./logger.service');

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
        this.experiment.startTime = new Date();
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

        // 5. Inference (Placeholder for next story)
        // const response = await Provider.chat(...)
    }

    /**
     * Evaluates goals to see if experiment should terminate.
     * @returns {Promise<string|null>} Description of met goal, or null.
     */
    async evaluateGoals() {
        if (!this.plan.goals || this.plan.goals.length === 0) return null;

        for (const goal of this.plan.goals) {
            try {
                // TODO: Implement actual python evaluation (Story 028)
                // For now, checks a simple boolean against variables if possible, 
                // or just returns null until implemented.
                const condition = goal.conditionScript;

                // Very basic mock evaluation for "Task 025" testing purposes solely:
                // If condition is "TRUE" string (debug), return true.
                if (condition.trim() === 'TRUE') {
                    return goal.description;
                }
            } catch (e) {
                this.eventBus.emit(EventTypes.LOG, {
                    experimentId: this.experiment._id,
                    stepNumber: this.experiment.currentStep,
                    source: 'SYSTEM',
                    message: `Goal evaluation failed for goal ${goal.description}`,
                    data: { error: e.message }
                });
                throw e; // Re-throw to be caught by runLoop and fail the experiment
            }
        }
        return null;
    }

    /**
     * Expose internal event bus emit for testing or external triggers.
     */
    emit(responseEvent, payload) {
        this.eventBus.emit(responseEvent, payload);
    }
}

module.exports = { ExperimentOrchestrator };
