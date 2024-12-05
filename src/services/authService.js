const { generateNonce } = require('../utils/nonceGenerator');
const { PublicKey } = require('@solana/web3.js');
const bs58 = require('bs58');
const nacl = require('tweetnacl');

class AuthService {
    createSignInData(domain) {
        return {
            domain,
            nonce: generateNonce(),
            issuedAt: new Date().toISOString(),
        };
    }

    async verifySignIn(message, signature, publicKeyStr) {
        try {
            // 1. Convert the public key string to a PublicKey object
            const publicKey = new PublicKey(publicKeyStr);
            
            // 2. Convert the message to Uint8Array (same as we did in frontend)
            const messageBytes = new TextEncoder().encode(message);
            
            // 3. Decode the base58 signature
            const signatureBytes = bs58.decode(signature);
            
            // 4. Verify the signature
            const isValid = await PublicKey.isOnCurve(publicKey.toBytes()) && 
                          nacl.sign.detached.verify(
                              messageBytes,
                              signatureBytes,
                              publicKey.toBytes()
                          );

            // 5. Extract and verify nonce from message
            const nonceMatch = message.match(/Nonce: ([A-Za-z0-9]+)/);
            const messageNonce = nonceMatch ? nonceMatch[1] : null;
            
            // 6. Extract public key from message
            const addressMatch = message.match(/^.*:\n([A-Za-z0-9]+)/m);
            const messageAddress = addressMatch ? addressMatch[1] : null;

            // 7. Verify all conditions
            return {
                verified: isValid && 
                         messageAddress === publicKeyStr && 
                         messageNonce !== null,
                reason: !isValid ? 'Invalid signature' :
                        messageAddress !== publicKeyStr ? 'Public key mismatch' :
                        !messageNonce ? 'Invalid message format' : null
            };
        } catch (error) {
            console.error('Signature verification error:', error);
            return {
                verified: false,
                reason: 'Invalid signature data'
            };
        }
    }
}

module.exports = new AuthService(); 