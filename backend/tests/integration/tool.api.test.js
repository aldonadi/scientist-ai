const request = require('supertest');
const app = require('../../src/index');
const Tool = require('../../src/models/tool.model');
const mongoose = require('mongoose');

// Mock the Tool model
jest.mock('../../src/models/tool.model');
// Mock mongoose connection to avoid real connection attempts
jest.mock('mongoose', () => {
    const original = jest.requireActual('mongoose');
    return {
        ...original,
        connect: jest.fn().mockResolvedValue(true),
        disconnect: jest.fn().mockResolvedValue(true),
    };
});

describe('POST /api/tools', () => {
    const validTool = {
        namespace: 'system',
        name: 'test_tool',
        description: 'A test tool',
        parameters: { type: 'object', properties: { foo: { type: 'string' } } },
        code: 'def test(): pass'
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create a new tool successfully (201)', async () => {
        // Mock Tool constructor and save method
        const saveMock = jest.fn().mockResolvedValue(validTool);
        Tool.mockImplementation(() => ({
            save: saveMock,
            ...validTool,
            _id: 'mocked_id'
        }));
        Tool.findOne.mockResolvedValue(null); // No duplicate

        const res = await request(app)
            .post('/api/tools')
            .send(validTool);

        expect(res.status).toBe(201);
        expect(res.body._id).toBe('mocked_id');
        expect(saveMock).toHaveBeenCalled();
    });

    it('should fail with 400 if validation fails (missing field)', async () => {
        const invalidTool = { ...validTool };
        delete invalidTool.name;

        const res = await request(app)
            .post('/api/tools')
            .send(invalidTool);

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Bad Request');
    });

    it('should fail with 400 if validation fails (invalid parameters)', async () => {
        const invalidTool = { ...validTool, parameters: 'string_not_object' };

        const res = await request(app)
            .post('/api/tools')
            .send(invalidTool);

        expect(res.status).toBe(400);
    });

    it('should fail with 409 if tool already exists', async () => {
        Tool.findOne.mockResolvedValue(validTool); // Simulate existing tool

        const res = await request(app)
            .post('/api/tools')
            .send(validTool);

        expect(res.status).toBe(409);
        expect(res.body.error).toBe('Conflict');
    });
});
