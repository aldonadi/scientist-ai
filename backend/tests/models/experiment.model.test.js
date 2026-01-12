const mongoose = require('mongoose');
const { Experiment } = require('../../src/models/experiment.model');
const { ExperimentPlan } = require('../../src/models/experimentPlan.model');

describe('Experiment Model Test', () => {
    let planId;

    beforeAll(async () => {
        // Connect to an in-memory database or mocking infrastructure if setup globally
        // Assuming global jest mongoose setup or individual test setup. 
        // Note: The user environment usually has a global setup/teardown for mongoose but 
        // for safety in unit tests we often mock or rely on the integration test setup. 
        // Here we'll treat it as a unit test for validation.

        // Just create a dummy ObjectId for planId to satisfy validation
        planId = new mongoose.Types.ObjectId();
    });

    it('should create & save experiment successfully', async () => {
        const validExperiment = new Experiment({
            planId: planId,
            status: 'INITIALIZING',
            currentStep: 0,
            currentEnvironment: {
                variables: { test: 1 },
                variableTypes: { test: 'int' }
            }
        });
        const savedExperiment = await validExperiment.validate();
        expect(savedExperiment).toBeUndefined(); // validate returns promise<void> on success

        expect(validExperiment.planId).toBe(planId);
        expect(validExperiment.status).toBe('INITIALIZING');
        expect(validExperiment.currentStep).toBe(0);
        expect(validExperiment.currentEnvironment.variables.test).toBe(1);
    });

    it('should fail schema validation without required fields', async () => {
        const experimentWithoutPlanId = new Experiment({
            status: 'RUNNING'
        });
        let err;
        try {
            await experimentWithoutPlanId.validate();
        } catch (error) {
            err = error;
        }
        expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
        expect(err.errors.planId).toBeDefined();
    });

    it('should fail schema validation with invalid status enum', async () => {
        const experimentWithInvalidStatus = new Experiment({
            planId: planId,
            status: 'INVALID_STATUS'
        });
        let err;
        try {
            await experimentWithInvalidStatus.validate();
        } catch (error) {
            err = error;
        }
        expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
        expect(err.errors.status).toBeDefined();
    });

    it('should default startTime to now', async () => {
        const experiment = new Experiment({
            planId: planId
        });
        expect(experiment.startTime).toBeDefined();
        // Check if it's a valid date
        expect(experiment.startTime instanceof Date).toBe(true);
    });
});
