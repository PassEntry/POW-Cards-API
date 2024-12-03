const authService = require('../../services/authService');

describe('AuthService', () => {
    test('createSignInData returns correct structure', () => {
        const domain = 'test.com';
        const result = authService.createSignInData(domain);

        expect(result).toEqual({
            domain: domain,
            statement: "Sign in with your Solana account",
            nonce: expect.any(String),
            issuedAt: expect.any(String)
        });
    });

    test('createSignInData generates valid ISO timestamp', () => {
        const result = authService.createSignInData('test.com');
        expect(() => new Date(result.issuedAt)).not.toThrow();
    });

    test('createSignInData generates nonce of correct length', () => {
        const result = authService.createSignInData('test.com');
        expect(result.nonce.length).toBe(8);
    });
}); 