const { generateNonce } = require('../utils/nonceGenerator');

class AuthService {
    createSignInData(domain) {
        return {
            domain,
            statement: "Sign in and create Solana POW Card",
            nonce: generateNonce(),
            issuedAt: new Date().toISOString(),
        };
    }
}

module.exports = new AuthService(); 