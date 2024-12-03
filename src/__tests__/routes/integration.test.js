const request = require('supertest');
const express = require('express');
const routes = require('../../routes');

const app = express();
app.use('/api/v1', routes);

describe('API Routes', () => {
    test('GET /api/v1/sign-in/create returns 200', async () => {
        const response = await request(app)
            .get('/api/v1/sign-in/create');
        
        expect(response.status).toBe(200);
    });

    test('GET /api/v1/sign-in/create returns correct data structure', async () => {
        const response = await request(app)
            .get('/api/v1/sign-in/create');
        
        expect(response.body).toEqual({
            domain: expect.any(String),
            statement: "Sign in with your Solana account",
            nonce: expect.any(String),
            issuedAt: expect.any(String)
        });
    });

    test('Invalid route returns 404', async () => {
        const response = await request(app)
            .get('/api/v1/invalid-route');
        
        expect(response.status).toBe(404);
    });
}); 