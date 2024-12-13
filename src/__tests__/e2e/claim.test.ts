import request from 'supertest';
import { app } from '../../server';
import { Keypair } from '@solana/web3.js';
import { TEST_CONSTANTS } from '../testConstants';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import passService from '../../services/passService';

jest.mock('../../services/passService');

describe('Claim Flow E2E', () => {
    let testKeypair: Keypair;
    let originalConsoleError: typeof console.error;
    const mockDownloadUrl = 'https://download.passentry.com/download?pass=mockId';

    beforeEach(() => {
        testKeypair = Keypair.generate();
        jest.clearAllMocks();
        
        // Silence console.error
        originalConsoleError = console.error;
        console.error = jest.fn();

        // Mock successful pass creation
        jest.mocked(passService.getOrCreateWalletPass).mockResolvedValue(mockDownloadUrl);
    });

    afterEach(() => {
        console.error = originalConsoleError;
    });

    describe('GET /api/v1/claim/init', () => {
        test('should create sign-in message with correct format', async () => {
            const response = await request(app)
                .get('/api/v1/claim/init')
                .query({ publicKey: testKeypair.publicKey.toBase58() })
                .set('Accept', 'application/json');

            expect(response.status).toBe(200);
            expect(response.headers['content-type']).toMatch(/json/);

            const { body } = response;
            expect(body).toEqual({
                domain: expect.any(String),
                nonce: expect.stringMatching(/^[A-Za-z0-9]{8}$/),
                issuedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
                message: expect.any(String)
            });
        });

        test('should use provided domain from request headers', async () => {
            const response = await request(app)
                .get('/api/v1/claim/init')
                .query({ publicKey: testKeypair.publicKey.toBase58() })
                .set('Host', TEST_CONSTANTS.TEST_DOMAIN);

            expect(response.status).toBe(200);
            expect(response.body.domain).toBe(TEST_CONSTANTS.TEST_DOMAIN);
        });

        test('should require publicKey parameter', async () => {
            const response = await request(app)
                .get('/api/v1/claim/init')
                .set('Accept', 'application/json');

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                error: 'Invalid request',
                details: 'Public key is required'
            });
        });
    });

    describe('POST /api/v1/claim/wallet-pass', () => {
        test('should return download URL with valid signature', async () => {
            // First get the claim data
            const initResponse = await request(app)
                .get('/api/v1/claim/init')
                .query({ publicKey: testKeypair.publicKey.toBase58() })
                .set('Host', TEST_CONSTANTS.TEST_DOMAIN);

            const { domain, nonce, issuedAt } = initResponse.body;

            // Create the message that was signed
            const message = `${domain} wants you to create a POW card with your Solana account:
${testKeypair.publicKey.toBase58()}

Nonce: ${nonce}
Issued At: ${issuedAt}`;

            // Sign the message
            const messageBytes = new TextEncoder().encode(message);
            const signature = nacl.sign.detached(messageBytes, testKeypair.secretKey);

            // Verify the signature
            const response = await request(app)
                .post('/api/v1/claim/wallet-pass')
                .send({
                    message,
                    signature: bs58.encode(signature),
                    publicKey: testKeypair.publicKey.toBase58()
                });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                downloadUrl: mockDownloadUrl
            });
        });

        test('should return 401 with invalid signature', async () => {
            const response = await request(app)
                .post('/api/v1/claim/wallet-pass')
                .send({
                    message: 'invalid message',
                    signature: 'invalid signature',
                    publicKey: testKeypair.publicKey.toBase58()
                });

            expect(response.status).toBe(401);
            expect(response.body).toEqual({
                error: 'Verification failed',
                details: expect.any(String)
            });
        });

        test('should return 400 with missing fields', async () => {
            const response = await request(app)
                .post('/api/v1/claim/wallet-pass')
                .send({
                    message: 'test message'
                    // missing signature and publicKey
                });

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                error: 'Missing required fields',
                details: 'Message, signature, and publicKey are required'
            });
        });

        test('should handle pass creation failure', async () => {
            // Mock pass creation failure
            jest.mocked(passService.getOrCreateWalletPass).mockRejectedValueOnce(
                Object.assign(new Error('Failed to create pass'), { details: 'Service unavailable' })
            );

            // First get the claim data
            const initResponse = await request(app)
                .get('/api/v1/claim/init')
                .query({ publicKey: testKeypair.publicKey.toBase58() })
                .set('Host', TEST_CONSTANTS.TEST_DOMAIN);

            const { domain, nonce, issuedAt } = initResponse.body;
            const message = `${domain} wants you to create a POW card with your Solana account:
${testKeypair.publicKey.toBase58()}

Nonce: ${nonce}
Issued At: ${issuedAt}`;

            const messageBytes = new TextEncoder().encode(message);
            const signature = nacl.sign.detached(messageBytes, testKeypair.secretKey);

            const response = await request(app)
                .post('/api/v1/claim/wallet-pass')
                .send({
                    message,
                    signature: bs58.encode(signature),
                    publicKey: testKeypair.publicKey.toBase58()
                });

            expect(response.status).toBe(500);
            expect(response.body).toEqual({
                error: 'Internal server error',
                details: 'Failed to process claim request'
            });
            expect(console.error).toHaveBeenCalledWith(
                'Error processing claim:',
                expect.any(Error)
            );
        });
    });
}); 