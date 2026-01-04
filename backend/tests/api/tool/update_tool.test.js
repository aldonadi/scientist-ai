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

describe('PUT /api/tools/:id', () => {

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

        test('should return 200 and update description and code', async () => {
            const createdTool = await Tool.create(sampleTool);

            const res = await request(app)
                .put(`/api/tools/${createdTool._id}`)
                .send({
                    description: 'Updated description',
                    code: 'print("Updated code")'
                });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('_id', createdTool._id.toString());
            expect(res.body.description).toBe('Updated description');
            expect(res.body.code).toBe('print("Updated code")');
            // Unchanged fields should remain
            expect(res.body.name).toBe('test_tool');
            expect(res.body.namespace).toBe('default');
        });

        test('should return 200 and update name only', async () => {
            const createdTool = await Tool.create(sampleTool);

            const res = await request(app)
                .put(`/api/tools/${createdTool._id}`)
                .send({ name: 'renamed_tool' });

            expect(res.status).toBe(200);
            expect(res.body.name).toBe('renamed_tool');
            expect(res.body.namespace).toBe('default');
            expect(res.body.description).toBe(sampleTool.description);
        });

        test('should return 200 and update namespace only', async () => {
            const createdTool = await Tool.create(sampleTool);

            const res = await request(app)
                .put(`/api/tools/${createdTool._id}`)
                .send({ namespace: 'new_namespace' });

            expect(res.status).toBe(200);
            expect(res.body.namespace).toBe('new_namespace');
            expect(res.body.name).toBe('test_tool');
        });

        test('should return 200 and update parameters', async () => {
            const createdTool = await Tool.create(sampleTool);

            const newParameters = {
                type: 'object',
                properties: {
                    newProp: { type: 'number' }
                },
                required: ['newProp']
            };

            const res = await request(app)
                .put(`/api/tools/${createdTool._id}`)
                .send({ parameters: newParameters });

            expect(res.status).toBe(200);
            expect(res.body.parameters).toEqual(newParameters);
        });

        test('should return 200 with empty body (no changes)', async () => {
            const createdTool = await Tool.create(sampleTool);

            const res = await request(app)
                .put(`/api/tools/${createdTool._id}`)
                .send({});

            expect(res.status).toBe(200);
            expect(res.body.name).toBe(sampleTool.name);
            expect(res.body.description).toBe(sampleTool.description);
        });

        test('should update updatedAt timestamp', async () => {
            const createdTool = await Tool.create(sampleTool);
            const originalUpdatedAt = new Date(createdTool.updatedAt).getTime();

            // Small delay to ensure timestamp difference
            await new Promise(resolve => setTimeout(resolve, 50));

            const res = await request(app)
                .put(`/api/tools/${createdTool._id}`)
                .send({ description: 'Changed' });

            expect(res.status).toBe(200);
            const newUpdatedAt = new Date(res.body.updatedAt).getTime();
            expect(newUpdatedAt).toBeGreaterThan(originalUpdatedAt);
        });

        test('should preserve fields not included in update', async () => {
            const createdTool = await Tool.create(sampleTool);

            const res = await request(app)
                .put(`/api/tools/${createdTool._id}`)
                .send({ description: 'New description only' });

            expect(res.status).toBe(200);
            expect(res.body.name).toBe(sampleTool.name);
            expect(res.body.namespace).toBe(sampleTool.namespace);
            expect(res.body.code).toBe(sampleTool.code);
            expect(res.body.parameters).toEqual(sampleTool.parameters);
            expect(res.body.description).toBe('New description only');
        });

    });

    describe('Error Cases - Duplicate Name/Namespace', () => {

        test('should return 400 when renaming to existing name in same namespace', async () => {
            // Create two tools in same namespace
            const toolA = await Tool.create({ ...sampleTool, name: 'tool_a' });
            await Tool.create({ ...sampleTool, name: 'tool_b' });

            // Try to rename tool_a to tool_b
            const res = await request(app)
                .put(`/api/tools/${toolA._id}`)
                .send({ name: 'tool_b' });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Bad Request');
            expect(res.body.message).toContain('already exists');
        });

        test('should return 400 when moving to namespace where name exists', async () => {
            const toolA = await Tool.create({ ...sampleTool, name: 'shared_name', namespace: 'ns_a' });
            await Tool.create({ ...sampleTool, name: 'shared_name', namespace: 'ns_b' });

            // Try to move tool_a from ns_a to ns_b
            const res = await request(app)
                .put(`/api/tools/${toolA._id}`)
                .send({ namespace: 'ns_b' });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Bad Request');
        });

        test('should allow renaming to a unique name', async () => {
            const toolA = await Tool.create({ ...sampleTool, name: 'tool_a' });
            await Tool.create({ ...sampleTool, name: 'tool_b' });

            // Rename to something unique
            const res = await request(app)
                .put(`/api/tools/${toolA._id}`)
                .send({ name: 'tool_c' });

            expect(res.status).toBe(200);
            expect(res.body.name).toBe('tool_c');
        });

        test('should allow updating other fields without triggering duplicate check', async () => {
            const toolA = await Tool.create({ ...sampleTool, name: 'tool_a' });
            await Tool.create({ ...sampleTool, name: 'tool_b' });

            // Update description only (no name/namespace change)
            const res = await request(app)
                .put(`/api/tools/${toolA._id}`)
                .send({ description: 'Updated' });

            expect(res.status).toBe(200);
            expect(res.body.description).toBe('Updated');
        });

    });

    describe('Error Cases - Invalid ID Format', () => {

        test('should return 400 for completely invalid ID string', async () => {
            const res = await request(app)
                .put('/api/tools/invalid-id-string')
                .send({ description: 'Updated' });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error', 'Bad Request');
            expect(res.body).toHaveProperty('message', 'Invalid tool ID format');
        });

        test('should return 400 for ID that is too short', async () => {
            const res = await request(app)
                .put('/api/tools/123')
                .send({ description: 'Updated' });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error', 'Bad Request');
        });

        test('should return 400 for ID with special characters', async () => {
            const res = await request(app)
                .put('/api/tools/abc!@#$%^&*()')
                .send({ description: 'Updated' });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error', 'Bad Request');
        });

    });

    describe('Error Cases - Not Found', () => {

        test('should return 404 when tool ID does not exist', async () => {
            const nonExistentId = new mongoose.Types.ObjectId();

            const res = await request(app)
                .put(`/api/tools/${nonExistentId}`)
                .send({ description: 'Updated' });

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('error', 'Not Found');
            expect(res.body).toHaveProperty('message', 'Tool not found');
        });

        test('should return 404 for valid ObjectId after tool is deleted', async () => {
            const createdTool = await Tool.create(sampleTool);
            const toolId = createdTool._id;
            await Tool.findByIdAndDelete(toolId);

            const res = await request(app)
                .put(`/api/tools/${toolId}`)
                .send({ description: 'Updated' });

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('error', 'Not Found');
        });

    });

    describe('Error Cases - Validation Errors', () => {

        test('should return 400 for invalid name format', async () => {
            const createdTool = await Tool.create(sampleTool);

            const res = await request(app)
                .put(`/api/tools/${createdTool._id}`)
                .send({ name: 'invalid-name-with-dashes' });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error', 'Bad Request');
        });

        test('should return 400 for empty name', async () => {
            const createdTool = await Tool.create(sampleTool);

            const res = await request(app)
                .put(`/api/tools/${createdTool._id}`)
                .send({ name: '' });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error', 'Bad Request');
        });

        test('should return 400 for invalid namespace format', async () => {
            const createdTool = await Tool.create(sampleTool);

            const res = await request(app)
                .put(`/api/tools/${createdTool._id}`)
                .send({ namespace: 'invalid namespace with spaces' });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error', 'Bad Request');
        });

        test('should return 400 for invalid parameters type', async () => {
            const createdTool = await Tool.create(sampleTool);

            const res = await request(app)
                .put(`/api/tools/${createdTool._id}`)
                .send({ parameters: 'not-an-object' });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error', 'Bad Request');
        });

    });

    describe('Edge Cases', () => {

        test('should handle unicode in description', async () => {
            const createdTool = await Tool.create(sampleTool);

            const res = await request(app)
                .put(`/api/tools/${createdTool._id}`)
                .send({ description: 'Updated with unicode: 日本語 🚀 émojis' });

            expect(res.status).toBe(200);
            expect(res.body.description).toBe('Updated with unicode: 日本語 🚀 émojis');
        });

        test('should handle multiline code update', async () => {
            const createdTool = await Tool.create(sampleTool);

            const multilineCode = 'def main():\n    print("line1")\n    print("line2")\n    return True';

            const res = await request(app)
                .put(`/api/tools/${createdTool._id}`)
                .send({ code: multilineCode });

            expect(res.status).toBe(200);
            expect(res.body.code).toContain('\n');
            expect(res.body.code).toContain('def main()');
        });

        test('should handle complex parameters schema update', async () => {
            const createdTool = await Tool.create(sampleTool);

            const complexParams = {
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
            };

            const res = await request(app)
                .put(`/api/tools/${createdTool._id}`)
                .send({ parameters: complexParams });

            expect(res.status).toBe(200);
            expect(res.body.parameters.properties.nested.properties.deep.type).toBe('string');
            expect(res.body.parameters.properties.array.type).toBe('array');
        });

        test('should handle updating all fields at once', async () => {
            const createdTool = await Tool.create(sampleTool);

            const fullUpdate = {
                name: 'completely_new_name',
                namespace: 'completely_new_namespace',
                description: 'Completely new description',
                code: 'print("completely new")',
                parameters: { type: 'object', properties: { new: { type: 'boolean' } } }
            };

            const res = await request(app)
                .put(`/api/tools/${createdTool._id}`)
                .send(fullUpdate);

            expect(res.status).toBe(200);
            expect(res.body.name).toBe(fullUpdate.name);
            expect(res.body.namespace).toBe(fullUpdate.namespace);
            expect(res.body.description).toBe(fullUpdate.description);
            expect(res.body.code).toBe(fullUpdate.code);
            expect(res.body.parameters).toEqual(fullUpdate.parameters);
        });

        test('should persist changes to database', async () => {
            const createdTool = await Tool.create(sampleTool);

            await request(app)
                .put(`/api/tools/${createdTool._id}`)
                .send({ description: 'Persisted change' });

            // Fetch directly from DB
            const toolFromDb = await Tool.findById(createdTool._id);
            expect(toolFromDb.description).toBe('Persisted change');
        });

    });

});
