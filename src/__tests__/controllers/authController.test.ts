import { Request, Response } from 'express';
import authController from '../../controllers/authController';
import authService from '../../services/authService';
import { TEST_CONSTANTS } from '../testConstants';
import claimService from '../../services/claimService';

jest.mock('../../services/authService');
jest.mock('../../services/claimService');

describe('AuthController', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
        jest.clearAllMocks();
        
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        
        const mockedAuthService = jest.mocked(authService, { shallow: false });
        mockedAuthService.createSignInMessage.mockReturnValue({
            domain: TEST_CONSTANTS.TEST_DOMAIN,
            nonce: TEST_CONSTANTS.MOCKED_NONCE,
            issuedAt: TEST_CONSTANTS.MOCKED_TIMESTAMP,
            message: TEST_CONSTANTS.TEST_MESSAGE
        });
        mockedAuthService.verifySignIn.mockReset();

        mockRequest = {
            headers: {
                host: TEST_CONSTANTS.TEST_DOMAIN
            },
            query: {
                publicKey: TEST_CONSTANTS.TEST_PUBLIC_KEY
            },
            body: {}
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
    });

    test('createSignInMessage returns 200 status', () => {
        authController.createSignInData(
            mockRequest as Request, 
            mockResponse as Response
        );

        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(authService.createSignInMessage).toHaveBeenCalledWith(
            TEST_CONSTANTS.TEST_DOMAIN,
            TEST_CONSTANTS.TEST_PUBLIC_KEY
        );
    });

    test('createSignInData returns correct data structure', () => {
        authController.createSignInData(
            mockRequest as Request, 
            mockResponse as Response
        );
        
        expect(mockResponse.json).toHaveBeenCalledWith({
            domain: TEST_CONSTANTS.TEST_DOMAIN,
            nonce: TEST_CONSTANTS.MOCKED_NONCE,
            issuedAt: TEST_CONSTANTS.MOCKED_TIMESTAMP,
            message: TEST_CONSTANTS.TEST_MESSAGE
        });
    });

    test('createSignInData handles errors', () => {
        mockRequest.query = { publicKey: TEST_CONSTANTS.TEST_PUBLIC_KEY };
        
        jest.mocked(authService).createSignInMessage.mockImplementationOnce(() => {
            throw new Error('Service error');
        });
        
        authController.createSignInData(
            mockRequest as Request, 
            mockResponse as Response
        );
        
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            'Error creating sign-in data:',
            expect.any(Error)
        );
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({
            error: 'Internal server error',
            details: 'Failed to create sign-in data'
        });
    });

    test('createSignInData handles missing publicKey', () => {
        mockRequest.query = {};
        
        authController.createSignInData(
            mockRequest as Request, 
            mockResponse as Response
        );
        
        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({
            error: 'Invalid request',
            details: 'Public key is required'
        });
    });

    describe('verifySignIn', () => {
        beforeEach(() => {
            mockRequest.body = {
                message: TEST_CONSTANTS.TEST_MESSAGE,
                signature: TEST_CONSTANTS.TEST_SIGNATURE,
                publicKey: TEST_CONSTANTS.TEST_PUBLIC_KEY,
                walletType: 'Generic'
            };
        });

        test('returns downloadUrl on successful verification', async () => {
            const mockDownloadUrl = 'https://example.com/pass';
            jest.mocked(claimService.handleClaim).mockResolvedValueOnce({ 
                downloadUrl: mockDownloadUrl 
            });

            await authController.verifySignIn(
                mockRequest as Request, 
                mockResponse as Response
            );

            expect(claimService.handleClaim).toHaveBeenCalledWith(
                TEST_CONSTANTS.TEST_MESSAGE,
                TEST_CONSTANTS.TEST_SIGNATURE,
                TEST_CONSTANTS.TEST_PUBLIC_KEY,
                'Generic'
            );
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({ 
                downloadUrl: mockDownloadUrl 
            });
        });

        test('handles custom wallet type', async () => {
            mockRequest.body.walletType = 'Phantom';
            const mockDownloadUrl = 'https://example.com/pass';
            
            jest.mocked(claimService.handleClaim).mockResolvedValueOnce({ 
                downloadUrl: mockDownloadUrl 
            });

            await authController.verifySignIn(
                mockRequest as Request, 
                mockResponse as Response
            );

            expect(claimService.handleClaim).toHaveBeenCalledWith(
                TEST_CONSTANTS.TEST_MESSAGE,
                TEST_CONSTANTS.TEST_SIGNATURE,
                TEST_CONSTANTS.TEST_PUBLIC_KEY,
                'Phantom'
            );
            expect(mockResponse.status).toHaveBeenCalledWith(200);
        });

        test('returns 401 on verification failure', async () => {
            jest.mocked(claimService.handleClaim).mockResolvedValueOnce({ 
                reason: 'Invalid signature' 
            });

            await authController.verifySignIn(
                mockRequest as Request, 
                mockResponse as Response
            );

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Verification failed',
                details: 'Invalid signature'
            });
        });

        test('verifySignIn handles service errors', async () => {
            jest.mocked(claimService.handleClaim).mockRejectedValueOnce(
                new Error('Service error')
            );

            await authController.verifySignIn(
                mockRequest as Request, 
                mockResponse as Response
            );

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'Error processing claim:',
                expect.any(Error)
            );
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Internal server error',
                details: 'Failed to process claim request'
            });
        });

        test('verifySignIn handles malformed JSON in request', async () => {
            const malformedRequest = {
                ...mockRequest,
                body: 'invalid json'
            };

            await authController.verifySignIn(
                malformedRequest as Request, 
                mockResponse as Response
            );

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Invalid request',
                details: 'Invalid request format'
            });
        });

        test('verifySignIn handles missing required fields', async () => {
            mockRequest.body = {
                message: TEST_CONSTANTS.TEST_MESSAGE,
            };

            await authController.verifySignIn(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Missing required fields',
                details: 'Message, signature, and publicKey are required'
            });
        });
    });
}); 