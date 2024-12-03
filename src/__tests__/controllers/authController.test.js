const authController = require('../../controllers/authController');

describe('AuthController', () => {
    let mockRequest;
    let mockResponse;

    beforeEach(() => {
        mockRequest = {
            headers: {
                host: 'test.com'
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
    });

    test('createSignInData returns correct data structure', () => {
        authController.createSignInData(mockRequest, mockResponse);
        
        expect(mockResponse.json).toHaveBeenCalledWith(
            expect.objectContaining({
                domain: 'test.com',
                statement: "Sign in with your Solana account",
                nonce: expect.any(String),
                issuedAt: expect.any(String)
            })
        );
    });

    test('createSignInData handles errors', () => {
        mockRequest.headers = null; // Force an error
        
        authController.createSignInData(mockRequest, mockResponse);
        
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({
            error: 'Internal server error'
        });
    });
}); 