const request = require('supertest');
const app = require('../../server');
const { Keypair } = require('@solana/web3.js');

const TEST_CONSTANTS = {
    TEST_DOMAIN: 'test-domain.com'
};

describe('Sign In Flow E2E', () => {
    let testKeypair;

    beforeEach(() => {
        testKeypair = Keypair.generate();
    });

    test('should create sign-in data with correct format', async () => {
        const response = await request(app)
            .get('/api/v1/sign-in/create')
            .query({ publicKey: testKeypair.publicKey.toBase58() })
            .set('Accept', 'application/json');

        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toMatch(/json/);

        const { body } = response;
        expect(body).toEqual({
            domain: expect.any(String),
            nonce: expect.stringMatching(/^[A-Za-z0-9]{8}$/),
            issuedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
        });
    });

    test('should use provided domain from request headers', async () => {
        const response = await request(app)
            .get('/api/v1/sign-in/create')
            .query({ publicKey: testKeypair.publicKey.toBase58() })
            .set('Host', TEST_CONSTANTS.TEST_DOMAIN);

        expect(response.status).toBe(200);
        expect(response.body.domain).toBe(TEST_CONSTANTS.TEST_DOMAIN);
    });

    test('should require publicKey parameter', async () => {
        const response = await request(app)
            .get('/api/v1/sign-in/create')
            .set('Accept', 'application/json');

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            error: 'Public key is required'
        });
    });
}); 