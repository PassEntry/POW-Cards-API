const authController = require('../../controllers/authController');
const authService = require('../../services/authService');

const TEST_CONSTANTS = {
    MOCKED_NONCE: 'mockedNonce123',
    MOCKED_TIMESTAMP: '2024-03-14T12:00:00Z',
    SIGN_IN_STATEMENT: 'Sign in and create Solana POW Card',
    TEST_DOMAIN: 'test.com'
};

jest.mock('../../services/authService', () => ({
    createSignInData: jest.fn().mockReturnValue({
        domain: TEST_CONSTANTS.TEST_DOMAIN,
        statement: TEST_CONSTANTS.SIGN_IN_STATEMENT,
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
        expect(authService.createSignInData).toHaveBeenCalledWith(TEST_CONSTANTS.TEST_DOMAIN);
    });

    test('createSignInData returns correct data structure', () => {
        authController.createSignInData(mockRequest, mockResponse);
        
        expect(mockResponse.json).toHaveBeenCalledWith({
            domain: TEST_CONSTANTS.TEST_DOMAIN,
            statement: TEST_CONSTANTS.SIGN_IN_STATEMENT,
            nonce: TEST_CONSTANTS.MOCKED_NONCE,
            issuedAt: TEST_CONSTANTS.MOCKED_TIMESTAMP
        });
    });

    test('createSignInData handles errors', () => {
        authService.createSignInData.mockImplementationOnce(() => {
            throw new Error('Service error');
        });
        
        authController.createSignInData(mockRequest, mockResponse);
        
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({
            error: 'Internal server error'
        });
    });
}); 