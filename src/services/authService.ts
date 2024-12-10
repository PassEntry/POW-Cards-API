import { generateNonce } from '../utils/nonceGenerator';
import bs58 from 'bs58';
import nacl from 'tweetnacl';
import { PublicKey } from '@solana/web3.js';

interface SignInData {
  domain: string;
  nonce: string;
  issuedAt: string;
}

interface VerifyResult {
  verified: boolean;
  reason: string | null;
}

interface NonceData {
  issuedAt: string;
  expiresAt: number;
  publicKey: string;
}

class AuthService {
  private _usedNonces = new Map<string, NonceData>();
  private nonceExpiration = 5 * 60 * 1000; // 5 minutes

  protected get usedNonces() {
    return this._usedNonces;
  }

  createSignInData(domain: string, publicKey: string): SignInData {
    const nonce = generateNonce();
    const issuedAt = new Date().toISOString();

    this._usedNonces.set(nonce, {
      issuedAt,
      expiresAt: Date.now() + this.nonceExpiration,
      publicKey
    });

    return { domain, nonce, issuedAt };
  }

  async verifySignIn(message: string, signature: string, publicKeyStr: string): Promise<VerifyResult> {
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
                 messageAddress === publicKeyStr,
        reason: !isValid ? 'Invalid signature' :
                messageAddress !== publicKeyStr ? 'Public key mismatch' :
                null
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

export default new AuthService();