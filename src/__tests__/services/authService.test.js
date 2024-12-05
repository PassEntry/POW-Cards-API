const authService = require('../../services/authService');
const { generateNonce } = require('../../utils/nonceGenerator');
const nacl = require('tweetnacl');
const { PublicKey, Keypair } = require('@solana/web3.js');
const bs58 = require('bs58');

const TEST_CONSTANTS = {
    MOCKED_NONCE: 'mockedNonce123',
    TEST_DOMAIN: 'test.com'
};

jest.mock('../../utils/nonceGenerator', () => ({
    generateNonce: jest.fn().mockReturnValue(TEST_CONSTANTS.MOCKED_NONCE)
}));

describe('AuthService', () => {
    let originalDateNow;

    beforeEach(() => {
        jest.clearAllMocks();
        // Mock Date.now() to return a fixed timestamp
        originalDateNow = Date.now;
        Date.now = jest.fn(() => 1647259200000); // 2022-03-14T12:00:00.000Z
    });

    afterEach(() => {
        // Restore original Date.now
        Date.now = originalDateNow;
    });

    describe('createSignInData', () => {
        let testKeypair;

        beforeEach(() => {
            testKeypair = Keypair.generate();
        });

        test('returns correct structure', () => {
            const result = authService.createSignInData(
                TEST_CONSTANTS.TEST_DOMAIN, 
                testKeypair.publicKey.toBase58()
            );

            expect(result).toEqual({
                domain: TEST_CONSTANTS.TEST_DOMAIN,
                nonce: TEST_CONSTANTS.MOCKED_NONCE,
                issuedAt: expect.any(String)
            });
            expect(generateNonce).toHaveBeenCalledTimes(1);
        });

        test('stores nonce with expiration and public key', () => {
            const publicKey = testKeypair.publicKey.toBase58();
            const result = authService.createSignInData(TEST_CONSTANTS.TEST_DOMAIN, publicKey);
            const storedNonce = authService.usedNonces.get(result.nonce);

            expect(storedNonce).toBeDefined();
            expect(storedNonce).toEqual({
                issuedAt: expect.any(String),
                expiresAt: Date.now() + authService.nonceExpiration,
                publicKey
            });
        });

        test('generates valid ISO timestamp', () => {
            const result = authService.createSignInData(TEST_CONSTANTS.TEST_DOMAIN);
            expect(() => new Date(result.issuedAt)).not.toThrow();
        });
    });

    describe('verifySignIn', () => {
        let keypair;
        let message;
        let signature;

        beforeEach(() => {
            // Create a test keypair
            keypair = Keypair.generate();
            message = `test.com wants you to create a POW card with your Solana account:
${keypair.publicKey.toBase58()}

Nonce: ${TEST_CONSTANTS.MOCKED_NONCE}
Issued At: 2024-03-14T12:00:00Z`;
            
            // Create a valid signature
            const messageBytes = new TextEncoder().encode(message);
            signature = nacl.sign.detached(messageBytes, keypair.secretKey);

            // Store the nonce as if it was just created
            authService.usedNonces.set(TEST_CONSTANTS.MOCKED_NONCE, {
                issuedAt: new Date().toISOString(),
                expiresAt: Date.now() + authService.nonceExpiration,
                publicKey: keypair.publicKey.toBase58()
            });
        });

        afterEach(() => {
            // Clear nonces after each test
            authService.usedNonces.clear();
        });

        test('should verify valid signature', async () => {
            const result = await authService.verifySignIn(
                message,
                bs58.encode(signature),
                keypair.publicKey.toBase58()
            );

            expect(result.verified).toBe(true);
            expect(result.reason).toBeNull();
            // Verify nonce was deleted after use
            expect(authService.usedNonces.has(TEST_CONSTANTS.MOCKED_NONCE)).toBe(false);
        });

        test('should reject invalid signature', async () => {
            const invalidSignature = Buffer.from(signature);
            invalidSignature[0] ^= 1; // Flip one bit to make signature invalid

            const result = await authService.verifySignIn(
                message,
                bs58.encode(invalidSignature),
                keypair.publicKey.toBase58()
            );

            expect(result.verified).toBe(false);
            expect(result.reason).toBe('Invalid signature');
        });

        test('should reject message with wrong public key', async () => {
            const wrongKeypair = Keypair.generate();
            
            // Update stored nonce to match the wrong keypair
            authService.usedNonces.set(TEST_CONSTANTS.MOCKED_NONCE, {
                issuedAt: new Date().toISOString(),
                expiresAt: Date.now() + authService.nonceExpiration,
                publicKey: wrongKeypair.publicKey.toBase58()
            });

            const result = await authService.verifySignIn(
                message,
                bs58.encode(signature),
                keypair.publicKey.toBase58()
            );

            expect(result.verified).toBe(false);
            expect(result.reason).toBe('Nonce was not issued for this public key');
        });

        test('should reject expired nonce', async () => {
            // Set nonce as expired
            authService.usedNonces.set(TEST_CONSTANTS.MOCKED_NONCE, {
                issuedAt: new Date().toISOString(),
                expiresAt: Date.now() - 1000 // Expired 1 second ago
            });

            const result = await authService.verifySignIn(
                message,
                bs58.encode(signature),
                keypair.publicKey.toBase58()
            );

            expect(result.verified).toBe(false);
            expect(result.reason).toBe('Nonce has expired');
            // Verify expired nonce was deleted
            expect(authService.usedNonces.has(TEST_CONSTANTS.MOCKED_NONCE)).toBe(false);
        });

        test('should reject unknown nonce', async () => {
            // Clear the nonce from storage
            authService.usedNonces.clear();

            const result = await authService.verifySignIn(
                message,
                bs58.encode(signature),
                keypair.publicKey.toBase58()
            );

            expect(result.verified).toBe(false);
            expect(result.reason).toBe('Invalid or expired nonce');
        });

        test('should reject malformed message without nonce', async () => {
            const malformedMessage = `test.com wants you to create a POW card with your Solana account:
${keypair.publicKey.toBase58()}

Issued At: 2024-03-14T12:00:00Z`;

            // Clear existing nonce
            authService.usedNonces.clear();

            const messageBytes = new TextEncoder().encode(malformedMessage);
            const malformedSignature = nacl.sign.detached(messageBytes, keypair.secretKey);

            const result = await authService.verifySignIn(
                malformedMessage,
                bs58.encode(malformedSignature),
                keypair.publicKey.toBase58()
            );

            expect(result.verified).toBe(false);
            expect(result.reason).toBe('Invalid or expired nonce');
        });
    });
}); 