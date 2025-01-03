import request from 'supertest';
import { app } from '../../server';

describe('Health Check E2E', () => {
    test('GET /health should return healthy status', async () => {
        const response = await request(app)
            .get('/health')
            .set('Accept', 'application/json');

        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toMatch(/json/);
        expect(response.body).toEqual({
            status: 'healthy'
        });
    });
}); 