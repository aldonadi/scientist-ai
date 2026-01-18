const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../../src/app');
const Tool = require('../../../src/models/tool.model');

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(async () => {
    await Tool.deleteMany({});
});

describe('GET /api/tools/:id', () => {

    const sampleTool = {
        name: 'test_tool',
        namespace: 'default',
        description: 'A test tool for unit testing',
        code: 'print("Hello, World!")',
        parameters: {
            type: 'object',
            properties: {
                input: { type: 'string' }
            }
        }
    };

    describe('Success Cases', () => {

        test('should return 200 and tool object when tool exists', async () => {
            // Seed a tool
            const createdTool = await Tool.create(sampleTool);

            const res = await request(app).get(`/api/tools/${createdTool._id}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('_id', createdTool._id.toString());
            expect(res.body).toHaveProperty('name', 'test_tool');
            expect(res.body).toHaveProperty('namespace', 'default');
            expect(res.body).toHaveProperty('description', 'A test tool for unit testing');
            expect(res.body).toHaveProperty('code', 'print("Hello, World!")');
            expect(res.body).toHaveProperty('parameters');
            expect(res.body.parameters).toEqual({
                type: 'object',
                properties: {
                    input: { type: 'string' }
                }
            });
            expect(res.body).toHaveProperty('createdAt');
            expect(res.body).toHaveProperty('updatedAt');
        });

        test('should return complete tool schema with all fields', async () => {
            const createdTool = await Tool.create(sampleTool);

            const res = await request(app).get(`/api/tools/${createdTool._id}`);

            expect(res.status).toBe(200);
            // Verify all expected fields are present
            const expectedFields = ['_id', 'name', 'namespace', 'description', 'code', 'parameters', 'createdAt', 'updatedAt'];
            expectedFields.forEach(field => {
                expect(res.body).toHaveProperty(field);
            });
        });

    });

    describe('Error Cases - Not Found', () => {

        test('should return 404 when tool ID does not exist', async () => {
            // Generate a valid but non-existent ObjectId
            const nonExistentId = new mongoose.Types.ObjectId();

            const res = await request(app).get(`/api/tools/${nonExistentId}`);

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('error', 'Not Found');
            expect(res.body).toHaveProperty('message', 'Tool not found');
        });

        test('should return 404 for valid ObjectId after tool is deleted', async () => {
            // Create and delete a tool
            const createdTool = await Tool.create(sampleTool);
            const toolId = createdTool._id;
            await Tool.findByIdAndDelete(toolId);

            const res = await request(app).get(`/api/tools/${toolId}`);

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('error', 'Not Found');
        });

    });

    describe('Error Cases - Invalid ID Format', () => {

        test('should return 400 for completely invalid ID string', async () => {
            const res = await request(app).get('/api/tools/invalid-id-string');

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error', 'Bad Request');
            expect(res.body).toHaveProperty('message', 'Invalid tool ID format');
        });

        test('should return 400 for ID that is too short', async () => {
            const res = await request(app).get('/api/tools/123');

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error', 'Bad Request');
            expect(res.body).toHaveProperty('message', 'Invalid tool ID format');
        });

        test('should return 400 for ID with special characters', async () => {
            const res = await request(app).get('/api/tools/abc!@#$%^&*()');

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error', 'Bad Request');
        });

        // Note: Empty ID or whitespace-only paths are normalized by Express and match
        // GET /api/tools (the list endpoint), so we cannot test that case here.

        test('should return 400 for ID with correct length but invalid characters', async () => {
            // 24 chars but with invalid hex characters
            const res = await request(app).get('/api/tools/zzzzzzzzzzzzzzzzzzzzzzzz');

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error', 'Bad Request');
        });

    });

    describe('Edge Cases', () => {

        test('should handle tool with minimal data', async () => {
            const minimalTool = {
                name: 'min',
                namespace: 'ns',
                description: 'x',
                code: 'x',
                parameters: {}
            };
            const createdTool = await Tool.create(minimalTool);

            const res = await request(app).get(`/api/tools/${createdTool._id}`);

            expect(res.status).toBe(200);
            expect(res.body.name).toBe('min');
            // Note: Model may apply defaults to parameters (e.g., type: 'object')
            expect(res.body).toHaveProperty('parameters');
        });

        test('should handle tool with complex parameters schema', async () => {
            const complexTool = {
                name: 'complex_tool',
                namespace: 'test',
                description: 'Tool with complex parameters',
                code: 'print("complex")',
                parameters: {
                    type: 'object',
                    properties: {
                        nested: {
                            type: 'object',
                            properties: {
                                deep: { type: 'string' }
                            }
                        },
                        array: {
                            type: 'array',
                            items: { type: 'number' }
                        }
                    },
                    required: ['nested']
                }
            };
            const createdTool = await Tool.create(complexTool);

            const res = await request(app).get(`/api/tools/${createdTool._id}`);

            expect(res.status).toBe(200);
            expect(res.body.parameters.properties.nested.properties.deep.type).toBe('string');
            expect(res.body.parameters.properties.array.type).toBe('array');
        });

        test('should handle tool with unicode in description', async () => {
            const unicodeTool = {
                ...sampleTool,
                name: 'unicode_tool',
                description: 'Tool with unicode: 日本語 🚀 émojis'
            };
            const createdTool = await Tool.create(unicodeTool);

            const res = await request(app).get(`/api/tools/${createdTool._id}`);

            expect(res.status).toBe(200);
            expect(res.body.description).toBe('Tool with unicode: 日本語 🚀 émojis');
        });

        test('should handle tool with multiline code', async () => {
            const multilineTool = {
                ...sampleTool,
                name: 'multiline_tool',
                code: 'def main():\n    print("line1")\n    print("line2")\n    return True'
            };
            const createdTool = await Tool.create(multilineTool);

            const res = await request(app).get(`/api/tools/${createdTool._id}`);

            expect(res.status).toBe(200);
            expect(res.body.code).toContain('\n');
            expect(res.body.code).toContain('def main()');
        });

    });

});
