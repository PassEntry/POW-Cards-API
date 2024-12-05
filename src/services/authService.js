const { generateNonce } = require('../utils/nonceGenerator');
const { PublicKey } = require('@solana/web3.js');
const bs58 = require('bs58');
const nacl = require('tweetnacl');

class AuthService {
    constructor() {
        //TODO: Store these in a DB
        this.usedNonces = new Map();
        this.nonceExpiration = 5 * 60 * 1000; // 5 minutes in milliseconds
    }

    createSignInData(domain, publicKey) {
        const nonce = generateNonce();
        const issuedAt = new Date().toISOString();
        
        // Store nonce with expiration and public key
        this.usedNonces.set(nonce, {
            issuedAt,
            expiresAt: Date.now() + this.nonceExpiration,
            publicKey // Store the public key that requested this nonce
        });

        return { domain, nonce, issuedAt };
    }

    async verifySignIn(message, signature, publicKeyStr) {
        try {
            // Extract nonce from message
            const nonceMatch = message.match(/Nonce: ([A-Za-z0-9]+)/);
            const messageNonce = nonceMatch ? nonceMatch[1] : null;

            // Verify nonce exists and hasn't expired
            const nonceData = this.usedNonces.get(messageNonce);
            if (!nonceData) {
                return {
                    verified: false,
                    reason: 'Invalid or expired nonce'
                };
            }

            // Check if nonce has expired
            if (Date.now() > nonceData.expiresAt) {
                this.usedNonces.delete(messageNonce);
                return {
                    verified: false,
                    reason: 'Nonce has expired'
                };
            }

            // Check if nonce was issued for this public key
            if (nonceData.publicKey && nonceData.publicKey !== publicKeyStr) {
                this.usedNonces.delete(messageNonce);
                return {
                    verified: false,
                    reason: 'Nonce was not issued for this public key'
                };
            }

            // Delete nonce after use
            this.usedNonces.delete(messageNonce);

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

            // 5. Extract public key from message
            const addressMatch = message.match(/^.*:\n([A-Za-z0-9]+)/m);
            const messageAddress = addressMatch ? addressMatch[1] : null;

            // 6. Verify all conditions
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