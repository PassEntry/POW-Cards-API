const { generateNonce } = require('../utils/nonceGenerator');

class AuthService {
    createSignInData(domain) {
        return {
            domain,
            statement: "Sign in with your Solana account",
            nonce: generateNonce(),
            issuedAt: new Date().toISOString(),
        };
    }
}

module.exports = new AuthService(); 