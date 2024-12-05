const authController = require('../../controllers/authController');
const authService = require('../../services/authService');

const TEST_CONSTANTS = {
    MOCKED_NONCE: 'mockedNonce123',
    MOCKED_TIMESTAMP: '2024-03-14T12:00:00Z',
    TEST_DOMAIN: 'test.com',
    TEST_PUBLIC_KEY: 'testPublicKey123'
};

jest.mock('../../services/authService', () => ({
    createSignInData: jest.fn().mockReturnValue({
        domain: TEST_CONSTANTS.TEST_DOMAIN,
        nonce: TEST_CONSTANTS.MOCKED_NONCE,
        issuedAt: TEST_CONSTANTS.MOCKED_TIMESTAMP
    })
}));

describe('AuthController', () => {
    let mockRequest;
    let mockResponse;

    beforeEach(() => {
        jest.clearAllMocks();
        mockRequest = {
            headers: {
                host: TEST_CONSTANTS.TEST_DOMAIN
            },
            query: {
                publicKey: TEST_CONSTANTS.TEST_PUBLIC_KEY
            }
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    test('createSignInData returns 200 status', () => {
        authController.createSignInData(mockRequest, mockResponse);
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(authService.createSignInData).toHaveBeenCalledWith(
            TEST_CONSTANTS.TEST_DOMAIN,
            TEST_CONSTANTS.TEST_PUBLIC_KEY
        );
    });

    test('createSignInData returns correct data structure', () => {
        authController.createSignInData(mockRequest, mockResponse);
        
        expect(mockResponse.json).toHaveBeenCalledWith({
            domain: TEST_CONSTANTS.TEST_DOMAIN,
            nonce: TEST_CONSTANTS.MOCKED_NONCE,
            issuedAt: TEST_CONSTANTS.MOCKED_TIMESTAMP
        });
    });

    test('createSignInData handles errors', () => {
        // First ensure the mock request has the required publicKey
        mockRequest.query.publicKey = TEST_CONSTANTS.TEST_PUBLIC_KEY;
        
        // Then mock the service to throw our intended error
        authService.createSignInData.mockImplementationOnce(() => {
            throw new Error('Service error');
        });
        
        authController.createSignInData(mockRequest, mockResponse);
        
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({
            error: 'Internal server error'
        });
    });

    test('createSignInData handles missing publicKey', () => {
        // Remove publicKey from request
        delete mockRequest.query.publicKey;
        
        authController.createSignInData(mockRequest, mockResponse);
        
        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({
            error: 'Public key is required'
        });
    });
}); 