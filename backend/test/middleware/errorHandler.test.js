const request = require('supertest');
const express = require('express');
const { notFoundHandler, errorHandler } = require('../../src/middleware/errorHandler');

describe('Error Handling Middleware', () => {
    let app;

    beforeAll(() => {
        app = express();
        app.use(express.json());

        // Test route for success
        app.get('/success', (req, res) => {
            res.status(200).json({ success: true });
        });

        // Test route for 400 Bad Request
        app.get('/bad-request', (req, res, next) => {
            const error = new Error('Bad Request');
            res.status(400);
            next(error);
        });

        // Test route for 500 Internal Server Error
        app.get('/server-error', (req, res, next) => {
            const error = new Error('Internal Server Error');
            next(error); // Default status is 500 if not set
        });

        // Apply middleware
        app.use(notFoundHandler);
        app.use(errorHandler);
    });

    test('should return 404 for non-existent routes', async () => {
        const res = await request(app).get('/non-existent-route');
        expect(res.statusCode).toEqual(404);
        expect(res.body).toEqual(expect.objectContaining({
            error: true,
            message: expect.stringContaining('Not Found'),
        }));
    });

    test('should return 400 for bad requests', async () => {
        const res = await request(app).get('/bad-request');
        expect(res.statusCode).toEqual(400);
        expect(res.body).toEqual(expect.objectContaining({
            error: true,
            message: 'Bad Request',
        }));
    });

    test('should return 500 for internal server errors', async () => {
        const res = await request(app).get('/server-error');
        expect(res.statusCode).toEqual(500);
        expect(res.body).toEqual(expect.objectContaining({
            error: true,
            message: 'Internal Server Error',
        }));
    });

    test('should hide stack trace in production', async () => {
        // Mock NODE_ENV
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';

        const res = await request(app).get('/server-error');
        expect(res.statusCode).toEqual(500);
        expect(res.body.stack).toBe('🥞');

        // Restore NODE_ENV
        process.env.NODE_ENV = originalEnv;
    });
});
