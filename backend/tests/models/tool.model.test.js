const mongoose = require('mongoose');
const Tool = require('../../src/models/tool.model');

describe('Tool Model Schema Test', () => {

    it('should be valid with all required fields', () => {
        const tool = new Tool({
            namespace: 'system',
            name: 'read_file',
            description: 'Reads a file',
            parameters: { type: 'object' },
            code: 'pass'
        });
        const err = tool.validateSync();
        expect(err).toBeUndefined();
    });

    it('should be invalid if required fields are missing', () => {
        const tool = new Tool({});
        const err = tool.validateSync();
        expect(err.errors.namespace).toBeDefined();
        expect(err.errors.name).toBeDefined();
    });

    it('should be invalid if name contains special characters', () => {
        const tool = new Tool({
            namespace: 'system',
            name: 'invalid name!',
            code: 'pass'
        });
        const err = tool.validateSync();
        expect(err.errors.name).toBeDefined();
        expect(err.errors.name.message).toContain('alphanumeric');
    });

    it('should have default values', () => {
        const tool = new Tool({
            namespace: 'system',
            name: 'basic_tool'
        });
        // validate first to apply defaults? No, defaults are applied on instantiation usually
        expect(tool.description).toBe('');
        expect(tool.parameters).toEqual({ type: 'object', properties: {} });
        expect(tool.code).toBe('');
    });

    it('should define the unique compound index', () => {
        const indexes = Tool.schema.indexes();
        const foundIndex = indexes.find(index => {
            const keys = index[0];
            return keys.namespace === 1 && keys.name === 1;
        });
        expect(foundIndex).toBeDefined();
        expect(foundIndex[1].unique).toBe(true);
    });
});
