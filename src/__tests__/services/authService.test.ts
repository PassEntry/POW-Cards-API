import authService from '../../services/authService';
import passService from '../../services/passService';
import * as nonceGenerator from '../../utils/nonceGenerator';
import nacl from 'tweetnacl';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import { TEST_CONSTANTS } from '../testConstants';

jest.mock('../../services/passService');

describe('AuthService', () => {
    let originalDateNow: typeof Date.now;
    let originalConsoleError: typeof console.error;
    const mockDownloadUrl = 'https://download.passentry.com/download?pass=mockId';

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(nonceGenerator, 'generateNonce').mockReturnValue(TEST_CONSTANTS.MOCKED_NONCE);
        originalDateNow = Date.now;
        originalConsoleError = console.error;
        Date.now = jest.fn(() => 1647259200000); // 2022-03-14T12:00:00.000Z
        console.error = jest.fn(); // Silence console.error

        // Mock successful pass creation
        jest.mocked(passService.getOrCreateWalletPass).mockResolvedValue(mockDownloadUrl);
    });

    afterEach(() => {
        Date.now = originalDateNow;
        console.error = originalConsoleError;
    });

    describe('createSignInData', () => {
        let testKeypair: Keypair;

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
            expect(nonceGenerator.generateNonce).toHaveBeenCalledTimes(1);
        });

        test('stores nonce with expiration and public key', () => {
            const publicKey = testKeypair.publicKey.toBase58();
            const result = authService.createSignInData(TEST_CONSTANTS.TEST_DOMAIN, publicKey);
            const storedNonce = (authService as any).usedNonces.get(result.nonce);

            expect(storedNonce).toBeDefined();
            expect(storedNonce).toEqual({
                issuedAt: expect.any(String),
                expiresAt: Date.now() + (authService as any).nonceExpiration,
                publicKey
            });
        });

        test('generates valid ISO timestamp', () => {
            const result = authService.createSignInData(
                TEST_CONSTANTS.TEST_DOMAIN,
                testKeypair.publicKey.toBase58()
            );
            expect(() => new Date(result.issuedAt)).not.toThrow();
        });
    });

    describe('verifySignIn', () => {
        let keypair: Keypair;
        let message: string;
        let signature: Uint8Array;

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

            // Setup valid nonce
            (authService as any).usedNonces.set(TEST_CONSTANTS.MOCKED_NONCE, {
                issuedAt: '2024-03-14T12:00:00Z',
                expiresAt: Date.now() + 300000, // 5 minutes from now
                publicKey: keypair.publicKey.toBase58()
            });
        });

        test('should return downloadUrl on successful verification', async () => {
            const result = await authService.verifySignIn(
                message,
                bs58.encode(signature),
                keypair.publicKey.toBase58()
            );

            expect(result).toEqual({
                downloadUrl: mockDownloadUrl
            });
            expect(passService.getOrCreateWalletPass).toHaveBeenCalledWith(
                keypair.publicKey.toBase58()
            );
        });

        test('should throw pass creation errors', async () => {
            // Mock the pass creation failure with our standard error format
            const mockError = Object.assign(
                new Error('Failed to create wallet pass'),
                { details: 'Service unavailable' }
            );
            
            jest.mocked(passService.getOrCreateWalletPass).mockRejectedValueOnce(mockError);

            await expect(authService.verifySignIn(
                message,
                bs58.encode(signature),
                keypair.publicKey.toBase58()
            )).rejects.toThrow('Failed to create wallet pass');

            expect(console.error).toHaveBeenCalledWith(
                'Verification or pass creation error:',
                expect.any(Error)
            );
        });

        test('should handle verification errors', async () => {
            // Create a verification error
            const verificationError = Object.assign(
                new Error('Invalid signature'),
                { isVerificationError: true }
            );
            
            jest.mocked(passService.getOrCreateWalletPass).mockRejectedValueOnce(verificationError);

            const result = await authService.verifySignIn(
                message,
                bs58.encode(signature),
                keypair.publicKey.toBase58()
            );

            expect(result).toEqual({
                reason: 'Invalid signature'
            });
            expect(console.error).toHaveBeenCalledWith(
                'Verification or pass creation error:',
                expect.any(Error)
            );
        });

        test('should reject invalid signature', async () => {
            const invalidSignature = Buffer.from(signature);
            invalidSignature[0] ^= 1; // Flip one bit to make signature invalid

            const result = await authService.verifySignIn(
                message,
                bs58.encode(invalidSignature),
                keypair.publicKey.toBase58()
            );

            expect(result.downloadUrl).toBeUndefined();
            expect(result.reason).toBeDefined();
        });

        test('should reject message with wrong public key', async () => {
            const wrongKeypair = Keypair.generate();
            
            // Update stored nonce to match the wrong keypair
            (authService as any).usedNonces.set(TEST_CONSTANTS.MOCKED_NONCE, {
                issuedAt: new Date().toISOString(),
                expiresAt: Date.now() + (authService as any).nonceExpiration,
                publicKey: wrongKeypair.publicKey.toBase58()
            });

            const result = await authService.verifySignIn(
                message,
                bs58.encode(signature),
                keypair.publicKey.toBase58()
            );

            expect(result.downloadUrl).toBeUndefined();
            expect(result.reason).toBe('Nonce was not issued for this public key');
        });

        test('should reject expired nonce', async () => {
            // Set nonce as expired
            (authService as any).usedNonces.set(TEST_CONSTANTS.MOCKED_NONCE, {
                issuedAt: new Date().toISOString(),
                expiresAt: Date.now() - 1000 // Expired 1 second ago
            });

            const result = await authService.verifySignIn(
                message,
                bs58.encode(signature),
                keypair.publicKey.toBase58()
            );

            expect(result.downloadUrl).toBeUndefined();
            expect(result.reason).toBe('Nonce has expired');
            // Verify expired nonce was deleted
            expect((authService as any).usedNonces.has(TEST_CONSTANTS.MOCKED_NONCE)).toBe(false);
        });

        test('should reject unknown nonce', async () => {
            // Clear the nonce from storage
            (authService as any).usedNonces.clear();

            const result = await authService.verifySignIn(
                message,
                bs58.encode(signature),
                keypair.publicKey.toBase58()
            );

            expect(result.downloadUrl).toBeUndefined();
            expect(result.reason).toBe('Invalid or expired nonce');
        });

        test('should reject malformed message without nonce', async () => {
            const malformedMessage = `test.com wants you to create a POW card with your Solana account:
${keypair.publicKey.toBase58()}

Issued At: 2024-03-14T12:00:00Z`;

            (authService as any).usedNonces.clear();

            const messageBytes = new TextEncoder().encode(malformedMessage);
            const malformedSignature = nacl.sign.detached(messageBytes, keypair.secretKey);

            const result = await authService.verifySignIn(
                malformedMessage,
                bs58.encode(malformedSignature),
                keypair.publicKey.toBase58()
            );

            expect(result.downloadUrl).toBeUndefined();
            expect(result.reason).toBe('Invalid or expired nonce');
        });
    });
});