import authService from './authService';
import passService from './passService';

interface ClaimResponse {
  downloadUrl?: string;
  reason?: string;
}

export class ClaimService {
  async handleClaim(message: string, signature: string, publicKeyStr: string, walletType: string = 'Generic'): Promise<ClaimResponse> {
    try {
      // First verify the signature
      const verificationResult = await authService.verifySignIn(message, signature, publicKeyStr);
      
      if (!verificationResult.success) {
        return { reason: verificationResult.reason };
      }

      // If verification succeeded, create/get the pass
      const downloadUrl = await passService.getOrCreateWalletPass(publicKeyStr, walletType);
      return { downloadUrl };

    } catch (error) {
      console.error('Claim processing error:', error);
      throw error;
    }
  }
}

export default new ClaimService(); 