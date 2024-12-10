import { Request, Response } from 'express';
import authController from '../../controllers/authController';
import authService from '../../services/authService';
import { TEST_CONSTANTS } from '../testConstants';

jest.mock('../../services/authService');

describe('AuthController', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Mock console.error
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        
        const mockedAuthService = jest.mocked(authService, { shallow: false });
        mockedAuthService.createSignInData.mockReturnValue({
            domain: TEST_CONSTANTS.TEST_DOMAIN,
            nonce: TEST_CONSTANTS.MOCKED_NONCE,
            issuedAt: TEST_CONSTANTS.MOCKED_TIMESTAMP
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

    test('createSignInData returns 200 status', () => {
        authController.createSignInData(
            mockRequest as Request, 
            mockResponse as Response
        );

        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(authService.createSignInData).toHaveBeenCalledWith(
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
            issuedAt: TEST_CONSTANTS.MOCKED_TIMESTAMP
        });
    });

    test('createSignInData handles errors', () => {
        mockRequest.query = { publicKey: TEST_CONSTANTS.TEST_PUBLIC_KEY };
        
        jest.mocked(authService).createSignInData.mockImplementationOnce(() => {
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
            error: 'Internal server error'
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
            error: 'Public key is required'
        });
    });

    describe('verifySignIn', () => {
        beforeEach(() => {
            mockRequest.body = {
                message: TEST_CONSTANTS.TEST_MESSAGE,
                signature: TEST_CONSTANTS.TEST_SIGNATURE,
                publicKey: TEST_CONSTANTS.TEST_PUBLIC_KEY
            };
        });

        test('verifySignIn returns 200 status with valid data', async () => {
            const mockVerifyResult = { verified: true, reason: null };
            jest.mocked(authService).verifySignIn.mockResolvedValueOnce(mockVerifyResult);

            await authController.verifySignIn(
                mockRequest as Request, 
                mockResponse as Response
            );

            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(mockVerifyResult);
        });

        test('verifySignIn handles missing fields', async () => {
            delete mockRequest.body.signature;

            await authController.verifySignIn(
                mockRequest as Request, 
                mockResponse as Response
            );

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Missing required fields'
            });
        });

        test('verifySignIn handles service errors', async () => {
            jest.mocked(authService).verifySignIn.mockRejectedValueOnce(
                new Error('Service error')
            );

            await authController.verifySignIn(
                mockRequest as Request, 
                mockResponse as Response
            );

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'Error verifying sign-in:',
                expect.any(Error)
            );
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Internal server error'
            });
        });
    });
}); 