const { generateNonce } = require('../../utils/nonceGenerator');

describe('NonceGenerator', () => {
    test('generates nonce of default length (8)', () => {
        const nonce = generateNonce();
        expect(nonce.length).toBe(8);
    });

    test('generates nonce of specified length', () => {
        const length = 12;
        const nonce = generateNonce(length);
        expect(nonce.length).toBe(length);
    });

    test('contains only alphanumeric characters', () => {
        const nonce = generateNonce();
        expect(nonce).toMatch(/^[A-Za-z0-9]+$/);
    });
}); 