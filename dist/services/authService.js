"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nonceGenerator_1 = require("../utils/nonceGenerator");
const bs58_1 = __importDefault(require("bs58"));
const tweetnacl_1 = __importDefault(require("tweetnacl"));
const web3_js_1 = require("@solana/web3.js");
class AuthService {
    constructor() {
        this._usedNonces = new Map();
        this.nonceExpiration = 5 * 60 * 1000; // 5 minutes
    }
    get usedNonces() {
        return this._usedNonces;
    }
    createSignInData(domain, publicKey) {
        const nonce = (0, nonceGenerator_1.generateNonce)();
        const issuedAt = new Date().toISOString();
        this._usedNonces.set(nonce, {
            issuedAt,
            expiresAt: Date.now() + this.nonceExpiration,
            publicKey
        });
        return { domain, nonce, issuedAt };
    }
    async verifySignIn(message, signature, publicKeyStr) {
        try {
            // Extract nonce from message
            const nonceMatch = message.match(/Nonce: ([A-Za-z0-9]+)/);
            if (!nonceMatch) {
                return {
                    verified: false,
                    reason: 'Invalid or expired nonce'
                };
            }
            const messageNonce = nonceMatch[1];
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
            const publicKey = new web3_js_1.PublicKey(publicKeyStr);
            // 2. Convert the message to Uint8Array (same as we did in frontend)
            const messageBytes = new TextEncoder().encode(message);
            // 3. Decode the base58 signature
            const signatureBytes = bs58_1.default.decode(signature);
            // 4. Verify the signature
            const isValid = await web3_js_1.PublicKey.isOnCurve(publicKey.toBytes()) &&
                tweetnacl_1.default.sign.detached.verify(messageBytes, signatureBytes, publicKey.toBytes());
            // 5. Extract public key from message
            const addressMatch = message.match(/^.*:\n([A-Za-z0-9]+)/m);
            const messageAddress = addressMatch ? addressMatch[1] : null;
            // 6. Verify all conditions
            return {
                verified: isValid &&
                    messageAddress === publicKeyStr,
                reason: !isValid ? 'Invalid signature' :
                    messageAddress !== publicKeyStr ? 'Public key mismatch' :
                        null
            };
        }
        catch (error) {
            console.error('Signature verification error:', error);
            return {
                verified: false,
                reason: 'Invalid signature data'
            };
        }
    }
}
exports.default = new AuthService();
