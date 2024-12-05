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
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('createSignInData returns correct structure', () => {
        const result = authService.createSignInData(TEST_CONSTANTS.TEST_DOMAIN);

        expect(result).toEqual({
            domain: TEST_CONSTANTS.TEST_DOMAIN,
            nonce: TEST_CONSTANTS.MOCKED_NONCE,
            issuedAt: expect.any(String)
        });
        expect(generateNonce).toHaveBeenCalledTimes(1);
    });

    test('createSignInData generates valid ISO timestamp', () => {
        const result = authService.createSignInData(TEST_CONSTANTS.TEST_DOMAIN);
        expect(() => new Date(result.issuedAt)).not.toThrow();
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
        });

        test('should verify valid signature', async () => {
            const result = await authService.verifySignIn(
                message,
                bs58.encode(signature),
                keypair.publicKey.toBase58()
            );

            expect(result.verified).toBe(true);
            expect(result.reason).toBeNull();
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
            
            const result = await authService.verifySignIn(
                message,
                bs58.encode(signature),
                wrongKeypair.publicKey.toBase58()
            );

            expect(result.verified).toBe(false);
            expect(result.reason).toBe('Public key mismatch');
        });
    });
}); 