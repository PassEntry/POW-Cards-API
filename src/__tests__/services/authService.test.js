const authService = require('../../services/authService');
const { generateNonce } = require('../../utils/nonceGenerator');

const TEST_CONSTANTS = {
    MOCKED_NONCE: 'mockedNonce123',
    SIGN_IN_STATEMENT: 'Sign in and create Solana POW Card',
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
            statement: TEST_CONSTANTS.SIGN_IN_STATEMENT,
            nonce: TEST_CONSTANTS.MOCKED_NONCE,
            issuedAt: expect.any(String)
        });
        expect(generateNonce).toHaveBeenCalledTimes(1);
    });

    test('createSignInData generates valid ISO timestamp', () => {
        const result = authService.createSignInData(TEST_CONSTANTS.TEST_DOMAIN);
        expect(() => new Date(result.issuedAt)).not.toThrow();
    });
}); 