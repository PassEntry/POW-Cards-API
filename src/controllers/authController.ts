import { Request, Response } from 'express';
import authService from '../services/authService';
import claimService from '../services/claimService';

export class AuthController {
  createSignInData(req: Request, res: Response): void {
    try {
      const domain = req.headers.host;
      const publicKey = req.query.publicKey as string;

      if (!publicKey) {
        res.status(400).json({ 
          error: 'Invalid request',
          details: 'Public key is required'
        });
        return;
      }

      const signInData = authService.createSignInMessage(domain!, publicKey);
      res.status(200).json(signInData);
    } catch (error) {
      console.error('Error creating sign-in data:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        details: 'Failed to create sign-in data'
      });
    }
  }

  async verifySignIn(req: Request, res: Response): Promise<void> {
    try {
      // Check if body is a valid object first
      if (typeof req.body !== 'object' || req.body === null) {
        res.status(400).json({ 
          error: 'Invalid request',
          details: 'Invalid request format'
        });
        return;
      }

      const { message, signature, publicKey, walletType } = req.body;

      if (!message || !signature || !publicKey) {
        res.status(400).json({ 
          error: 'Missing required fields',
          details: 'Message, signature, and publicKey are required'
        });
        return;
      }

      const result = await claimService.handleClaim(
        message, 
        signature, 
        publicKey, 
        walletType || 'generic'
      );
      
      if (result.downloadUrl) {
        res.status(200).json({ downloadUrl: result.downloadUrl });
        return;
      }

      res.status(401).json({ 
        error: 'Verification failed',
        details: result.reason 
      });
    } catch (error) {
      console.error('Error processing claim:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        details: 'Failed to process claim request'
      });
    }
  }
}

export default new AuthController();