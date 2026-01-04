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

describe('GET /api/tools', () => {

    // Seed data
    const tools = [
        {
            name: 'tool1',
            namespace: 'default',
            description: 'Tool 1 description',
            code: 'print("tool1")',
            parameters: { type: 'object' }
        },
        {
            name: 'tool2',
            namespace: 'default',
            description: 'Tool 2 description',
            code: 'print("tool2")',
            parameters: { type: 'object' }
        },
        {
            name: 'custom_tool',
            namespace: 'custom',
            description: 'Custom tool description',
            code: 'print("custom")',
            parameters: { type: 'object' }
        }
    ];

    test('should return empty array when no tools exist', async () => {
        const res = await request(app).get('/api/tools');
        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });

    test('should return all tools when no filter is provided', async () => {
        await Tool.insertMany(tools);

        const res = await request(app).get('/api/tools');
        expect(res.status).toBe(200);
        expect(res.body.length).toBe(3);
        // Sort by name to ensure consistent order for comparison
        const sortedTools = res.body.sort((a, b) => a.name.localeCompare(b.name));
        expect(sortedTools[0].name).toBe('custom_tool');
        expect(sortedTools[1].name).toBe('tool1');
        expect(sortedTools[2].name).toBe('tool2');
    });

    test('should filter tools by namespace', async () => {
        await Tool.insertMany(tools);

        // Filter for 'default'
        const resDefault = await request(app).get('/api/tools?namespace=default');
        expect(resDefault.status).toBe(200);
        expect(resDefault.body.length).toBe(2);
        resDefault.body.forEach(tool => {
            expect(tool.namespace).toBe('default');
        });

        // Filter for 'custom'
        const resCustom = await request(app).get('/api/tools?namespace=custom');
        expect(resCustom.status).toBe(200);
        expect(resCustom.body.length).toBe(1);
        expect(resCustom.body[0].name).toBe('custom_tool');
    });

    test('should return empty array for non-existent namespace', async () => {
        await Tool.insertMany(tools);

        const resres = await request(app).get('/api/tools?namespace=nonexistent');
        expect(resres.status).toBe(200);
        expect(resres.body).toEqual([]);
    });

    test('should return 200 and schema validation', async () => {
        await Tool.create(tools[0]);
        const res = await request(app).get('/api/tools');
        expect(res.status).toBe(200);
        const tool = res.body[0];
        expect(tool).toHaveProperty('_id');
        expect(tool).toHaveProperty('name', 'tool1');
        expect(tool).toHaveProperty('namespace', 'default');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('code');
        expect(tool).toHaveProperty('parameters');
        expect(tool).toHaveProperty('createdAt');
        expect(tool).toHaveProperty('updatedAt');
    });
});
