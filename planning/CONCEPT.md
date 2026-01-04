Please help me design a robust agentic AI experiment framework.

Here is the overall concept: The system allows me to run "experiments" involving one or more AI agent-controlled "roles" which act via "tools" upon the experiment's "environment" state until specific expiriment-ending "goal" conditions are met. This system coordinates the I/O to/from the agent models and logs all interactions, tools calls, and state changes in a replayable form. It also runs scripts which register hooks to various phases of the environment execution. Logs capture unstructured environment data and so likely should be a NoSQL database like MongoDB.  The system needs to be able to interact with various LLM provider back-ends including OpenAI and Ollama.

It needs to have three interfaces: RESTful API, a web-based interface, and a terminal-based interface.

I propose a MEAN stack for this system. The RESTful API can be implemented in Express. The web UI can be implemented either in Express or Angular (I am open to suggestions before we begin). We will work on the terminal interface at a later time.

Here are the objects I think I need to be able to CRUD from the UI:

- Environment
    - Purpose: Holds all of the state corresponding to a specific step of an Experiment
    - Cardinality: 1 instance per Experiment or ExperimentPlan
    - Holds an arbitrary number of named variables that will be queried and acted upon during the course of the experiment
    - Must be able to support booleans, integers, floats, strings, and enums
    - Exposes the ability to make a DeepCopy
    - Exposes the ability to be serialized as a JSON object
        - This is how it will be stored in the database
        - Also, the JSON is how it will be delivered as input to a Model
    
- Tool
    - Purpose: A Python script that exposes itself as an OpenAI-compatible Tool for use by AI agents
    - All tools act upon an Environment (therefore all tool calls need to be passed in a reference to an Environment)
    - All tools are also able to do other things like write Logs
    - Each tool is under a namespace (I think it can simple be a string identifier)
        - All tools within a namespace must have unique names
    - There will be a central library of all tools, so that they can be easily imported into an ExperimentPlan.
        - Tools can also be copied into a new namespace, where they can optionally be modified.

- Model
    - Reference to an LLM model that can be sent input and have its thinking and output retrieved
    - Can use a backend
        - Right now, we need to implement an Ollama interface
        - Maybe later we can do Groq, OpenAI, Anthropic, Google, etc
    - We need to be able to send it a prompt and retrieve its thinking and output via streaming
    
- Role
    - Purpose: Specifies an AI agent model and the capabilities that it has access to.
    - Cardinality: 0 to many
    - Has a Model that will be assigned to this Role
    - Has a System prompt that will be used when sending prompts to the Model
    - These are also under a namespace (similar to the Tool objects)
    - Has an array of Tools that this Role is able to call
    - Can emit Log messages (which will automatically have a reference to the Role that emitted this message)
        - However, Roles cannot interact directly with Log objects. They instead interact with the Experiment which will add a reference to the Experiment before passing the log to the Log object.
        - TODO: Maybe this is NOT the best way to do this. Perhaps it is better to handle per-role Logs using scripts instead
    
- Goal
    - Purpose: Given an Environment, specifies a Condition which ends the Experiment in a certian result.
    - When the Condition is true, (e.g. `env.CashOnHand < 0.0`) then the Experiment can be ended with a result (e.g. "BrokeAndInDebtorsPrison").
    - The condition should be implemented as a Python method that can contain as many actual conditionals as it needs and should return either True or False
    - The condition can query the Environment state that is passed to it.
    - The Condition can also check things like the current date/time, the current expirement Step, etc (TODO: should these data be contained in an Environment object, instead?)
        - E.g. most Experiments should probably have a MaxStepsTaken that ends the Experiment after some sane maximum number of steps (to prevent infinite experiments)
            - TODO: Or should this be directly attached to the ExperimentPlan itself?
    - TODO: I am open to any suggestions you have for how to structure this better. Are `Goal` objects the best way to capture expiriment-ending conditions?
    
- ExperimentPlan
    - Purpose: Contains theconfiguration, objects, and default state pertaining to one potential experiment. An experiment might be something like "Running a Lemonade Stand" or "Making Paperclips". This is only a template and is not runnable.
    - Cardinality: 0 to many
    - These should be able to be easily duplicated
        - So that different variations of an Experiment can be easily created
    - Members:
        - Array of Role objects: the agent roles that will be operated during this kind of experiment.
            - The Role objects in the array will be operated in the order they appear in the array.
        - Environment object (maybe called InitialEnvironment?): The complete list of environment state variables, their types, and their default values at the beginning ("time 0", as it were) of an Experiment
        - Array of Goals: The Goals which will end this type of Experiment.
    - Scripts:
        - An array of Scripts and their hook types.
            - These are Python scripts.
            - Each Script can hook on StepStart, StepEnd, BeforeToolCall, AfterToolCall, BeforeModelPrompt, AfterModelResponse, or OnChange(some_environment_variable).
                - OnChange will mean that the script will run every time the associated Environment variable is changed
            - Scripts need to be able to say "The Step (turn) is done right now"
        - TODO: What do you think of this Script system? I need some way to architect the way that the Environment reacts to changes. For example, simulating the sending the agent a threatening legal email if they do something nefarious.
- Log
    - Purpose: A chronological, timestamped record of arbitrary messages. Messages can, optionally, be appended with a copy of a current Environment state
    - Persisted in a database.
    - Associated with an Experiment
        
- Experiment
    - Purpose: An ExperimentPlan that has been commenced, and perhaps ended. Operates in a cyclic, turn-based, and structured set of phases called `Step`s.
    - Instantiated from an ExperimentPlan and starts with Environment state per the defaults in the ExperimentPlan
    - The Experiment starts on Step 1. 
    - Contains a Log
    - Stores some metadata (TODO: Should this be in the Environment instead?)
        - Experiment GUID
        - Time started
        - Time ended (if ended)
        - Current step number
    - The basic phases of execution are this (note: Log entries need to be emitted at every part of every step, attaching a copy of the current Environment whenever appropriate):
        - Initializing
            - Instantiate the Experiment from an existing ExperimentPlan
            - Populate the Environment variable state using the default values listed in the ExperimentPlan
            - Record the start time (somethere: in the Environment? or should that be attached to the Experiment itself?)
            - Set the Step number to 1.
            - Run any script registered to the ExperimentStart hook
        - Running
            - Run any scripts registered to the StartStep hook
            - For each Role in Experiment's Roles array (in the order that they appear in the array):
                - Build a Prompt consisting of:
                    - The Role's System prompt.
                    - The current Environment filtered to that this role should see
                        - TODO: Not sure the best way to configure this. See TODOs at the end.
                    - The tools that are available to this role, in a format such that the model can understand that these are tools.
                    - A user prompt, maybe something as simple as "What do you do?" or "Make your move" or "Do something"
                - Run any script registered to the BeforeModelPrompt hook, and pass in the complete prompt
                - Send the prompt to the Role (which should in turn pass it to the Model using the appropriate back-end)
                - Gather the prompt's thinking stream and output stream
                - If the model wants to call a tool:
                    - Run any script registered to the BeforeToolCall, passing any thinking/output stream gathered so far, and passing the tool and arguments that the model wants to make
                        - This is where I can implement things like "models can only make so many tool calls inside a single step" or specify that some tool calls consume the step and some do not
                    - Run the tool with the arguments provided by the model
                        - Tools are passed the Environment and are allowed to change variables in the Environment state
                        - Any script registered to the OnChange hook for the variable being changed should be run at this point
                    - Run any scripts registered to the AfterToolCall, passing again the tool call made, the arguments provided, and the output of the tool
                        - Remember, scripts always get the Environment too
                    - Give the tool output to the Model
                - Call any script hooked to AfterModelResponse, passing it the thinking/output response from the model
            - After all Roles have been given their chance to act:
            - For each Goal:
                - Check if its Condition is met
                    - If so, mark the Experiment as Concluded/Ended/Done/Closed based on the message configured in the Goal.
        - Ended
            - Run any script registered to the ExperimentEnd hook
    - Notes:
        - Experiments should report Step number and current phase of the step to the Scientist
        - Experiments should probably run each in their own thread or at least asynchronously

- Scientist
    - Coordinates in-progress Experiments
    - I think this should basically be a View
    - For the web-UI, it should populate a table of running Experiments with controls to pause/stop/inspect them
    - When inspecting an Experiment that is in progress, it should show the current Step number, a % of steps completed toward the Max Step, an average time per step, and an estimated time to completion.
    - TODO: Is there a better way to handle this?
        - I want to be able to easily stop runaway/misbehaving experiments
        - FOr example an Experiment that has a malfunctioning Script that is consuming all CPU, etc
                

- TODO: Filtering Environment state by role
    - Environment state is passed to models as a complete JSON representation
    - However, I want to be able to restrict it such that different Roles only get to see certain whitelisted Environment state.
    - For example, a "Business Operator" model should not be able to read the status of the "FBI_Currently_Investigating" flag
    - I need to pass some environment state to the model
    - Should I put this "access filter" on:
        - The Role? How? A list of string variable names what are whitelisted?
        - The Environment? Do I really want the Environment to know anything about Roles?
        - A separate object/class? Something like EnvironmentRoleFilter or RoleEnvironmentFilter or something else?
    - Please help me process the best way to approach this.
    
- TODO: Terminal UI. We will NOT work on this now. Later.
