import authService from '../../services/authService';
import * as nonceGenerator from '../../utils/nonceGenerator';
import nacl from 'tweetnacl';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import { TEST_CONSTANTS } from '../testConstants';

describe('AuthService', () => {
    let originalDateNow: typeof Date.now;
    let originalConsoleError: typeof console.error;
    let testKeypair: Keypair;

    beforeEach(() => {
        jest.clearAllMocks();
        testKeypair = Keypair.generate();
        jest.spyOn(nonceGenerator, 'generateNonce').mockReturnValue(TEST_CONSTANTS.MOCKED_NONCE);
        
        originalDateNow = Date.now;
        originalConsoleError = console.error;
        Date.now = jest.fn(() => 1647259200000); // 2022-03-14T12:00:00.000Z
        console.error = jest.fn();
    });

    afterEach(() => {
        Date.now = originalDateNow;
        console.error = originalConsoleError;
    });

    describe('createSignInMessage', () => {
        test('returns correct structure', () => {
            const result = authService.createSignInMessage(
                TEST_CONSTANTS.TEST_DOMAIN, 
                testKeypair.publicKey.toBase58()
            );

            const expectedMessage = 
`${TEST_CONSTANTS.TEST_DOMAIN} wants you to create a POW card with your Solana account:
${testKeypair.publicKey.toBase58()}

Nonce: ${TEST_CONSTANTS.MOCKED_NONCE}
Issued At: ${result.issuedAt}`;

            expect(result).toEqual({
                domain: TEST_CONSTANTS.TEST_DOMAIN,
                nonce: TEST_CONSTANTS.MOCKED_NONCE,
                issuedAt: expect.any(String),
                message: expectedMessage
            });
        });

        test('stores message with expiration', () => {
            const publicKey = testKeypair.publicKey.toBase58();
            const result = authService.createSignInMessage(TEST_CONSTANTS.TEST_DOMAIN, publicKey);
            
            const storedData = (authService as any).activeMessages.get(publicKey);
            expect(storedData).toBeDefined();
            expect(storedData).toEqual({
                message: result.message,
                expiresAt: Date.now() + (authService as any).nonceExpiration,
                nonce: TEST_CONSTANTS.MOCKED_NONCE
            });
        });
    });

    describe('verifySignIn', () => {
        let message: string;
        let signature: Uint8Array;

        beforeEach(() => {
            const result = authService.createSignInMessage(
                TEST_CONSTANTS.TEST_DOMAIN,
                testKeypair.publicKey.toBase58()
            );
            message = result.message;
            
            const messageBytes = new TextEncoder().encode(message);
            signature = nacl.sign.detached(messageBytes, testKeypair.secretKey);
        });

        test('accepts valid signature and message', async () => {
            const result = await authService.verifySignIn(
                message,
                bs58.encode(signature),
                testKeypair.publicKey.toBase58()
            );

            expect(result.success).toBe(true);
            expect(result.reason).toBeUndefined();
        });

        test('rejects tampered message', async () => {
            // First create and store a valid message
            const originalMessage = authService.createSignInMessage(
                TEST_CONSTANTS.TEST_DOMAIN,
                testKeypair.publicKey.toBase58()
            );
            
            // Create a tampered message by changing just the domain
            // but keeping the exact same format
            const tamperedMessage = originalMessage.message.replace(
                TEST_CONSTANTS.TEST_DOMAIN,
                'malicious.com'
            );

            // Sign the tampered message
            const messageBytes = new TextEncoder().encode(tamperedMessage);
            const tamperedSignature = nacl.sign.detached(messageBytes, testKeypair.secretKey);

            const verifyResult = await authService.verifySignIn(
                tamperedMessage,
                bs58.encode(tamperedSignature),
                testKeypair.publicKey.toBase58()
            );

            expect(verifyResult.success).toBe(false);
            expect(verifyResult.reason).toBe('Message has been tampered with');
        });

        test('rejects expired message', async () => {
            // Fast forward time past expiration
            const futureTime = Date.now() + (6 * 60 * 1000); // 6 minutes
            jest.mocked(Date.now).mockReturnValue(futureTime);

            const result = await authService.verifySignIn(
                message,
                bs58.encode(signature),
                testKeypair.publicKey.toBase58()
            );

            expect(result.success).toBe(false);
            expect(result.reason).toBe('Message has expired');
        });

        test('rejects malformed message', async () => {
            const malformedMessage = `${TEST_CONSTANTS.TEST_DOMAIN} invalid format
${testKeypair.publicKey.toBase58()}`;

            const result = await authService.verifySignIn(
                malformedMessage,
                bs58.encode(signature),
                testKeypair.publicKey.toBase58()
            );

            expect(result.success).toBe(false);
            expect(result.reason).toBe('Message has been tampered with');
        });

        test('deletes message after successful verification', async () => {
            await authService.verifySignIn(
                message,
                bs58.encode(signature),
                testKeypair.publicKey.toBase58()
            );

            const storedMessage = (authService as any).activeMessages.get(testKeypair.publicKey.toBase58());
            expect(storedMessage).toBeUndefined();
        });

        test('rejects invalid public key format', async () => {
            // Create a valid message first
            const result = authService.createSignInMessage(
                TEST_CONSTANTS.TEST_DOMAIN,
                testKeypair.publicKey.toBase58()
            );
            
            const verifyResult = await authService.verifySignIn(
                result.message,
                bs58.encode(signature),
                'invalid-public-key-format'
            );

            expect(verifyResult.success).toBe(false);
            expect(verifyResult.reason).toBe('Invalid public key or signature format');
        });

        test('rejects invalid signature format', async () => {
            const result = await authService.verifySignIn(
                message,
                'invalid-signature',
                testKeypair.publicKey.toBase58()
            );

            expect(result.success).toBe(false);
            expect(result.reason).toBe('Invalid public key or signature format');
        });

        test('rejects message signed by different wallet', async () => {
            const differentKeypair = Keypair.generate();
            const messageBytes = new TextEncoder().encode(message);
            const wrongSignature = nacl.sign.detached(messageBytes, differentKeypair.secretKey);

            const result = await authService.verifySignIn(
                message,
                bs58.encode(wrongSignature),
                testKeypair.publicKey.toBase58()
            );

            expect(result.success).toBe(false);
            expect(result.reason).toBe('Invalid signature');
        });

        test('rejects when no active message exists for public key', async () => {
            const differentKeypair = Keypair.generate();
            
            const result = await authService.verifySignIn(
                message,
                bs58.encode(signature),
                differentKeypair.publicKey.toBase58()
            );

            expect(result.success).toBe(false);
            expect(result.reason).toBe('No active message found for this public key');
        });

        describe('message format validation', () => {
            test('rejects message with wrong number of lines', async () => {
                const invalidMessage = `${TEST_CONSTANTS.TEST_DOMAIN} wants you to create a POW card with your Solana account:
${testKeypair.publicKey.toBase58()}
Nonce: ${TEST_CONSTANTS.MOCKED_NONCE}
Issued At: ${new Date().toISOString()}`; // Missing empty line

                const result = await authService.verifySignIn(
                    invalidMessage,
                    bs58.encode(signature),
                    testKeypair.publicKey.toBase58()
                );

                expect(result.success).toBe(false);
                expect(result.reason).toBe('Message has been tampered with');
            });

            test('rejects message with invalid nonce format', async () => {
                const invalidMessage = message.replace(
                    `Nonce: ${TEST_CONSTANTS.MOCKED_NONCE}`,
                    'Nonce: @invalid!'
                );

                const result = await authService.verifySignIn(
                    invalidMessage,
                    bs58.encode(signature),
                    testKeypair.publicKey.toBase58()
                );

                expect(result.success).toBe(false);
                expect(result.reason).toBe('Message has been tampered with');
            });

            test('rejects message with invalid timestamp format', async () => {
                const invalidMessage = message.replace(
                    /Issued At: .*$/,
                    'Issued At: 2024-03-14 12:00:00' // Wrong format
                );

                const result = await authService.verifySignIn(
                    invalidMessage,
                    bs58.encode(signature),
                    testKeypair.publicKey.toBase58()
                );

                expect(result.success).toBe(false);
                expect(result.reason).toBe('Message has been tampered with');
            });
        });

        describe('createSignInMessage', () => {
            test('overwrites existing message for same public key', () => {
                const publicKey = testKeypair.publicKey.toBase58();
                
                // Mock different nonces for each call
                jest.mocked(nonceGenerator.generateNonce)
                    .mockReturnValueOnce('first-nonce')
                    .mockReturnValueOnce('second-nonce');
                
                // Create first message
                const result1 = authService.createSignInMessage(TEST_CONSTANTS.TEST_DOMAIN, publicKey);
                
                // Create second message
                const result2 = authService.createSignInMessage(TEST_CONSTANTS.TEST_DOMAIN, publicKey);
                
                // Check only second message exists
                const storedData = (authService as any).activeMessages.get(publicKey);
                expect(storedData.message).toBe(result2.message);
                expect(storedData.message).not.toBe(result1.message);
                expect(storedData.nonce).toBe('second-nonce');
            });

            test('creates valid ISO timestamp', () => {
                const result = authService.createSignInMessage(
                    TEST_CONSTANTS.TEST_DOMAIN,
                    testKeypair.publicKey.toBase58()
                );

                const timestamp = result.message.match(/Issued At: (.*)/)?.[1];
                expect(() => new Date(timestamp!).toISOString()).not.toThrow();
                expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
            });
        });

        describe('additional security cases', () => {
            test('rejects message with correct format but wrong nonce', async () => {
                // Create original message
                const result = authService.createSignInMessage(
                    TEST_CONSTANTS.TEST_DOMAIN,
                    testKeypair.publicKey.toBase58()
                );
                
                // Create message with different nonce but same format
                const tamperedMessage = result.message.replace(
                    /Nonce: [A-Za-z0-9]+/,
                    'Nonce: differentNonce123'
                );
                
                const messageBytes = new TextEncoder().encode(tamperedMessage);
                const signature = nacl.sign.detached(messageBytes, testKeypair.secretKey);

                const verifyResult = await authService.verifySignIn(
                    tamperedMessage,
                    bs58.encode(signature),
                    testKeypair.publicKey.toBase58()
                );

                expect(verifyResult.success).toBe(false);
                expect(verifyResult.reason).toBe('Message has been tampered with');
            });

            test('rejects message with modified timestamp', async () => {
                const result = authService.createSignInMessage(
                    TEST_CONSTANTS.TEST_DOMAIN,
                    testKeypair.publicKey.toBase58()
                );
                
                const tamperedMessage = result.message.replace(
                    /Issued At: .+Z$/,
                    'Issued At: 2024-01-01T00:00:00.000Z'
                );
                
                const messageBytes = new TextEncoder().encode(tamperedMessage);
                const signature = nacl.sign.detached(messageBytes, testKeypair.secretKey);

                const verifyResult = await authService.verifySignIn(
                    tamperedMessage,
                    bs58.encode(signature),
                    testKeypair.publicKey.toBase58()
                );

                expect(verifyResult.success).toBe(false);
                expect(verifyResult.reason).toBe('Message has been tampered with');
            });

            test('rejects when public key in message differs from provided public key', async () => {
                const differentKeypair = Keypair.generate();
                const result = authService.createSignInMessage(
                    TEST_CONSTANTS.TEST_DOMAIN,
                    testKeypair.publicKey.toBase58()
                );
                
                // Try to verify with different public key than what's in message
                const verifyResult = await authService.verifySignIn(
                    result.message,
                    bs58.encode(signature),
                    differentKeypair.publicKey.toBase58()
                );

                expect(verifyResult.success).toBe(false);
                expect(verifyResult.reason).toBe('No active message found for this public key');
            });

            test('handles concurrent verifications correctly', async () => {
                const result = authService.createSignInMessage(
                    TEST_CONSTANTS.TEST_DOMAIN,
                    testKeypair.publicKey.toBase58()
                );
                
                const messageBytes = new TextEncoder().encode(result.message);
                const signature = nacl.sign.detached(messageBytes, testKeypair.secretKey);
                const encodedSignature = bs58.encode(signature);

                // Try to verify the same message twice concurrently
                const [firstResult, secondResult] = await Promise.all([
                    authService.verifySignIn(
                        result.message,
                        encodedSignature,
                        testKeypair.publicKey.toBase58()
                    ),
                    authService.verifySignIn(
                        result.message,
                        encodedSignature,
                        testKeypair.publicKey.toBase58()
                    )
                ]);

                // First one should succeed
                expect(firstResult.success).toBe(true);
                
                // Second one should fail because message was deleted
                expect(secondResult.success).toBe(false);
                expect(secondResult.reason).toBe('No active message found for this public key');
            });
        });
    });
});