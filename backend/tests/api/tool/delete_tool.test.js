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

describe('DELETE /api/tools/:id', () => {

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

        test('should return 200 and delete an existing tool', async () => {
            const createdTool = await Tool.create(sampleTool);

            const res = await request(app)
                .delete(`/api/tools/${createdTool._id}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('message', 'Tool deleted successfully');
            expect(res.body).toHaveProperty('id', createdTool._id.toString());
        });

        test('should return 404 when trying to GET the deleted tool', async () => {
            const createdTool = await Tool.create(sampleTool);
            const toolId = createdTool._id;

            // Delete the tool
            const deleteRes = await request(app)
                .delete(`/api/tools/${toolId}`);
            expect(deleteRes.status).toBe(200);

            // Try to GET the deleted tool
            const getRes = await request(app)
                .get(`/api/tools/${toolId}`);
            expect(getRes.status).toBe(404);
            expect(getRes.body).toHaveProperty('error', 'Not Found');
        });

        test('should confirm tool is removed from database', async () => {
            const createdTool = await Tool.create(sampleTool);
            const toolId = createdTool._id;

            await request(app)
                .delete(`/api/tools/${toolId}`);

            // Check directly in DB
            const toolFromDb = await Tool.findById(toolId);
            expect(toolFromDb).toBeNull();
        });

        test('should delete tool without affecting other tools', async () => {
            const tool1 = await Tool.create({ ...sampleTool, name: 'tool_1' });
            const tool2 = await Tool.create({ ...sampleTool, name: 'tool_2' });
            const tool3 = await Tool.create({ ...sampleTool, name: 'tool_3' });

            // Delete tool2
            const res = await request(app)
                .delete(`/api/tools/${tool2._id}`);

            expect(res.status).toBe(200);

            // Verify other tools still exist
            const remainingTools = await Tool.find({});
            expect(remainingTools).toHaveLength(2);
            expect(remainingTools.map(t => t.name)).toContain('tool_1');
            expect(remainingTools.map(t => t.name)).toContain('tool_3');
            expect(remainingTools.map(t => t.name)).not.toContain('tool_2');
        });

    });

    describe('Error Cases - Not Found', () => {

        test('should return 404 for non-existent tool (random valid ObjectId)', async () => {
            const nonExistentId = new mongoose.Types.ObjectId();

            const res = await request(app)
                .delete(`/api/tools/${nonExistentId}`);

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('error', 'Not Found');
            expect(res.body).toHaveProperty('message', 'Tool not found');
        });

        test('should return 404 when deleting a tool that was already deleted', async () => {
            const createdTool = await Tool.create(sampleTool);
            const toolId = createdTool._id;

            // First delete
            const firstDeleteRes = await request(app)
                .delete(`/api/tools/${toolId}`);
            expect(firstDeleteRes.status).toBe(200);

            // Second delete
            const secondDeleteRes = await request(app)
                .delete(`/api/tools/${toolId}`);
            expect(secondDeleteRes.status).toBe(404);
            expect(secondDeleteRes.body).toHaveProperty('error', 'Not Found');
            expect(secondDeleteRes.body).toHaveProperty('message', 'Tool not found');
        });

        test('should return 404 for a tool deleted via direct DB manipulation', async () => {
            const createdTool = await Tool.create(sampleTool);
            const toolId = createdTool._id;

            // Delete directly from DB
            await Tool.findByIdAndDelete(toolId);

            // Try to delete via API
            const res = await request(app)
                .delete(`/api/tools/${toolId}`);

            expect(res.status).toBe(404);
        });

    });

    describe('Error Cases - Invalid ID Format', () => {

        test('should return 400 for completely invalid ID string', async () => {
            const res = await request(app)
                .delete('/api/tools/invalid-id-string');

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error', 'Bad Request');
            expect(res.body).toHaveProperty('message', 'Invalid tool ID format');
        });

        test('should return 400 for ID that is too short', async () => {
            const res = await request(app)
                .delete('/api/tools/123');

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error', 'Bad Request');
            expect(res.body).toHaveProperty('message', 'Invalid tool ID format');
        });

        test('should return 400 for ID that is too long', async () => {
            const res = await request(app)
                .delete('/api/tools/507f1f77bcf86cd799439011507f1f77bcf86cd799439011');

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error', 'Bad Request');
        });

        test('should return 400 for ID with special characters', async () => {
            const res = await request(app)
                .delete('/api/tools/abc!@#$%^&*()');

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error', 'Bad Request');
        });

        test('should return 400 for empty ID', async () => {
            // This will hit the list route, but included for coverage
            const res = await request(app)
                .delete('/api/tools/');

            // DELETE on /api/tools/ typically returns 404 (no matching route) or hits list
            // Depending on Express routing, this may vary
            expect([400, 404]).toContain(res.status);
        });

        test('should return 400 for ID with spaces', async () => {
            const res = await request(app)
                .delete('/api/tools/id with spaces');

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error', 'Bad Request');
        });

        test('should return 400 for ID with unicode characters', async () => {
            const res = await request(app)
                .delete('/api/tools/工具名称');

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error', 'Bad Request');
        });

    });

    describe('Edge Cases', () => {

        test('should handle deletion of tool with minimal fields', async () => {
            const minimalTool = await Tool.create({
                name: 'minimal',
                namespace: 'test',
                description: 'Minimal tool',
                code: 'pass',
                parameters: {}
            });

            const res = await request(app)
                .delete(`/api/tools/${minimalTool._id}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('message', 'Tool deleted successfully');
        });

        test('should handle deletion of tool with complex parameters', async () => {
            const complexTool = await Tool.create({
                ...sampleTool,
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
            });

            const res = await request(app)
                .delete(`/api/tools/${complexTool._id}`);

            expect(res.status).toBe(200);
        });

        test('should handle deletion of tool with unicode content', async () => {
            const unicodeTool = await Tool.create({
                ...sampleTool,
                name: 'unicode_tool',
                description: '日本語ツール with émojis 🚀'
            });

            const res = await request(app)
                .delete(`/api/tools/${unicodeTool._id}`);

            expect(res.status).toBe(200);
        });

        test('should handle deletion of tool with very long code', async () => {
            const longCode = 'x = ' + 'a'.repeat(10000);
            const longCodeTool = await Tool.create({
                ...sampleTool,
                code: longCode
            });

            const res = await request(app)
                .delete(`/api/tools/${longCodeTool._id}`);

            expect(res.status).toBe(200);
        });

        test('should handle concurrent deletion attempts gracefully', async () => {
            const createdTool = await Tool.create(sampleTool);
            const toolId = createdTool._id;

            // Send two delete requests at the same time
            const [res1, res2] = await Promise.all([
                request(app).delete(`/api/tools/${toolId}`),
                request(app).delete(`/api/tools/${toolId}`)
            ]);

            // One should succeed (200), one should get 404
            const statuses = [res1.status, res2.status].sort();
            expect(statuses).toEqual([200, 404]);
        });

        test('should allow recreating a tool after deletion', async () => {
            const createdTool = await Tool.create(sampleTool);
            const toolId = createdTool._id;

            // Delete the tool
            await request(app)
                .delete(`/api/tools/${toolId}`);

            // Recreate with same name/namespace
            const recreateRes = await request(app)
                .post('/api/tools')
                .send(sampleTool);

            expect(recreateRes.status).toBe(201);
            expect(recreateRes.body.name).toBe(sampleTool.name);
            expect(recreateRes.body.namespace).toBe(sampleTool.namespace);
            expect(recreateRes.body._id).not.toBe(toolId.toString());
        });

    });

    describe('Response Format', () => {

        test('should return proper JSON structure on success', async () => {
            const createdTool = await Tool.create(sampleTool);

            const res = await request(app)
                .delete(`/api/tools/${createdTool._id}`);

            expect(res.status).toBe(200);
            expect(res.headers['content-type']).toMatch(/application\/json/);
            expect(Object.keys(res.body)).toEqual(['message', 'id']);
            expect(typeof res.body.message).toBe('string');
            expect(typeof res.body.id).toBe('string');
        });

        test('should return proper JSON structure on 404 error', async () => {
            const nonExistentId = new mongoose.Types.ObjectId();

            const res = await request(app)
                .delete(`/api/tools/${nonExistentId}`);

            expect(res.status).toBe(404);
            expect(res.headers['content-type']).toMatch(/application\/json/);
            expect(res.body).toHaveProperty('error');
            expect(res.body).toHaveProperty('message');
        });

        test('should return proper JSON structure on 400 error', async () => {
            const res = await request(app)
                .delete('/api/tools/bad-id');

            expect(res.status).toBe(400);
            expect(res.headers['content-type']).toMatch(/application\/json/);
            expect(res.body).toHaveProperty('error');
            expect(res.body).toHaveProperty('message');
        });

    });

});
