const mongoose = require('mongoose');
const { GoalSchema } = require('../../../src/models/schemas/goal.schema');

// Test Model
const Goal = mongoose.models.GoalTest || mongoose.model('GoalTest', new mongoose.Schema({
    goal: GoalSchema
}));

describe('Goal Schema', () => {
    it('should validate a valid goal', async () => {
        const validGoal = {
            goal: {
                description: 'Maximize profit',
                conditionScript: 'total_profit > 1000'
            }
        };

        const doc = new Goal(validGoal);
        await doc.validate();
        expect(doc.goal.description).toBe('Maximize profit');
        expect(doc.goal.conditionScript).toBe('total_profit > 1000');
    });

    it('should require description', async () => {
        const invalidGoal = {
            goal: {
                conditionScript: 'true'
            }
        };

        const doc = new Goal(invalidGoal);
        let err;
        try {
            await doc.validate();
        } catch (error) {
            err = error;
        }
        expect(err).toBeDefined();
        expect(err.errors['goal.description']).toBeDefined();
    });

    it('should require conditionScript', async () => {
        const invalidGoal = {
            goal: {
                description: 'test'
            }
        };

        const doc = new Goal(invalidGoal);
        let err;
        try {
            await doc.validate();
        } catch (error) {
            err = error;
        }
        expect(err).toBeDefined();
        expect(err.errors['goal.conditionScript']).toBeDefined();
    });
});
