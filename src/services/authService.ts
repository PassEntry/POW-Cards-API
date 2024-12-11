import { generateNonce } from '../utils/nonceGenerator';
import bs58 from 'bs58';
import nacl from 'tweetnacl';
import { PublicKey } from '@solana/web3.js';
import passService from './passService';

interface SignInData {
  domain: string;
  nonce: string;
  issuedAt: string;
}

interface VerifyResult {
  success: boolean;
  reason?: string;
}

interface NonceData {
  issuedAt: string;
  expiresAt: number;
  publicKey: string;
}

interface ClaimResponse {
  downloadUrl?: string;
  reason?: string;
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

  async verifySignIn(message: string, signature: string, publicKeyStr: string): Promise<ClaimResponse> {
    try {
      const verificationResult = await this.verifySignature(message, signature, publicKeyStr);
      
      if (!verificationResult.success) {
        return { reason: verificationResult.reason };
      }

      // Only create pass if verification succeeded
      const downloadUrl = await passService.createWalletPass(publicKeyStr);
      return { downloadUrl };

    } catch (error) {
      console.error('Verification or pass creation error:', error);
      // Only return reason for verification failures, throw other errors
      if (error instanceof Error && (error as any).isVerificationError) {
        return { reason: error.message };
      }
      throw error; // Let the controller handle pass creation errors
    }
  }

  private async verifySignature(message: string, signature: string, publicKeyStr: string): Promise<VerifyResult> {
    // Extract and verify nonce
    const nonceVerification = this.verifyNonce(message, publicKeyStr);
    if (!nonceVerification.success) {
      return nonceVerification;
    }

    // Verify signature
    const publicKey = new PublicKey(publicKeyStr);
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = bs58.decode(signature);
    
    const isValid = await PublicKey.isOnCurve(publicKey.toBytes()) && 
                  nacl.sign.detached.verify(
                    messageBytes,
                    signatureBytes,
                    publicKey.toBytes()
                  );

    // Verify message address
    const addressMatch = message.match(/^.*:\n([A-Za-z0-9]+)/m);
    const messageAddress = addressMatch ? addressMatch[1] : null;

    if (!isValid || messageAddress !== publicKeyStr) {
      return {
        success: false,
        reason: !isValid ? 'Invalid signature' : 'Public key mismatch'
      };
    }

    return { success: true };
  }

  private verifyNonce(message: string, publicKeyStr: string): VerifyResult {
    // Extract nonce from message
    const nonceMatch = message.match(/Nonce: ([A-Za-z0-9]+)/);
    if (!nonceMatch) {
      return {
        success: false,
        reason: 'Invalid or expired nonce'
      };
    }
    const messageNonce = nonceMatch[1];

    // Verify nonce exists and hasn't expired
    const nonceData = this.usedNonces.get(messageNonce);
    if (!nonceData) {
      return {
        success: false,
        reason: 'Invalid or expired nonce'
      };
    }

    // Check if nonce has expired
    if (Date.now() > nonceData.expiresAt) {
      this.usedNonces.delete(messageNonce);
      return {
        success: false,
        reason: 'Nonce has expired'
      };
    }

    // Check if nonce was issued for this public key
    if (nonceData.publicKey && nonceData.publicKey !== publicKeyStr) {
      this.usedNonces.delete(messageNonce);
      return {
        success: false,
        reason: 'Nonce was not issued for this public key'
      };
    }

    // Delete nonce after use
    this.usedNonces.delete(messageNonce);

    return { success: true };
  }
}

export default new AuthService();