import { generateNonce } from '../utils/nonceGenerator';
import bs58 from 'bs58';
import nacl from 'tweetnacl';
import { PublicKey } from '@solana/web3.js';

interface SignInData {
  domain: string;
  nonce: string;
  issuedAt: string;
  message: string;
}

interface VerifyResult {
  success: boolean;
  reason?: string;
}

interface StoredMessageData {
  message: string;
  expiresAt: number;
  nonce: string;
}

interface ClaimResponse {
  downloadUrl?: string;
  reason?: string;
}

export class AuthService {
  private readonly nonceExpiration = 5 * 60 * 1000; // 5 minutes
  private activeMessages = new Map<string, StoredMessageData>();

  createSignInMessage(domain: string, publicKey: string): SignInData {
    const nonce = generateNonce();
    const issuedAt = new Date().toISOString();
    
    // Create the complete message
    const message = `${domain} wants you to create a POW card with your Solana account:
${publicKey}

Nonce: ${nonce}
Issued At: ${issuedAt}`;

    // Store the message with the public key as primary key
    this.activeMessages.set(publicKey, {
      message,
      expiresAt: Date.now() + this.nonceExpiration,
      nonce
    });

    return { message, nonce, issuedAt, domain };
  }

  async verifySignIn(message: string, signature: string, publicKeyStr: string): Promise<VerifyResult> {
    try {
      const verificationResult = await this.verifySignature(message, signature, publicKeyStr);
      return verificationResult;
    } catch (error) {
      console.error('Verification error:', error);
      if (error instanceof Error && (error as any).isVerificationError) {
        return { 
          success: false, 
          reason: error.message 
        };
      }
      throw error;
    }
  }

  private async verifySignature(message: string, signature: string, publicKeyStr: string): Promise<VerifyResult> {
    try {
        // First validate public key format
        const publicKey = new PublicKey(publicKeyStr);
        if (!await PublicKey.isOnCurve(publicKey.toBytes())) {
            return {
                success: false,
                reason: 'Invalid public key or signature format'
            };
        }

        // Then check for active message
        const storedData = this.activeMessages.get(publicKeyStr);
        if (!storedData) {
            return {
                success: false,
                reason: 'No active message found for this public key'
            };
        }

        // Check expiration
        if (Date.now() > storedData.expiresAt) {
            this.activeMessages.delete(publicKeyStr);
            return {
                success: false,
                reason: 'Message has expired'
            };
        }

        // Extract domain for format validation
        const domainMatch = message.match(/^([^\s]+) wants you to create/);
        if (!domainMatch) {
            return {
                success: false,
                reason: 'Invalid message format'
            };
        }
        const domain = domainMatch[1];

        // Validate message format
        if (!this.validateMessageFormat(message, domain, publicKeyStr)) {
            return {
                success: false,
                reason: 'Invalid message format'
            };
        }

        // Compare with stored message after format validation
        if (message !== storedData.message) {
            return {
                success: false,
                reason: 'Message has been tampered with'
            };
        }

        // Verify signature
        const messageBytes = new TextEncoder().encode(message);
        const signatureBytes = bs58.decode(signature);
        
        const isValid = nacl.sign.detached.verify(
            messageBytes,
            signatureBytes,
            publicKey.toBytes()
        );

        if (!isValid) {
            return {
                success: false,
                reason: 'Invalid signature'
            };
        }

        // Delete the message after successful verification
        this.activeMessages.delete(publicKeyStr);
        
        return { success: true };
    } catch (error) {
        return {
            success: false,
            reason: 'Invalid public key or signature format'
        };
    }
  }

  private validateMessageFormat(message: string, domain: string, publicKeyStr: string): boolean {
    try {
      // Split message into lines for easier validation
      const lines = message.split('\n');
      if (lines.length !== 5) return false;

      // Line 1: Domain and prefix
      if (lines[0] !== `${domain} wants you to create a POW card with your Solana account:`) {
        return false;
      }

      // Line 2: Public key
      if (lines[1] !== publicKeyStr) {
        return false;
      }

      // Line 3: Empty line
      if (lines[2] !== '') {
        return false;
      }

      // Line 4: Nonce
      const nonceMatch = lines[3].match(/^Nonce: ([A-Za-z0-9]{8,})$/);
      if (!nonceMatch) {
        return false;
      }

      // Line 5: Timestamp
      const timestampMatch = lines[4].match(
        /^Issued At: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/
      );
      if (!timestampMatch) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }
}

export default new AuthService();