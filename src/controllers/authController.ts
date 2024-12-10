import { Request, Response } from 'express';
import authService from '../services/authService';

export class AuthController {
  createSignInData(req: Request, res: Response): void {
    try {
      const domain = req.headers.host;
      const publicKey = req.query.publicKey as string;

      if (!publicKey) {
        res.status(400).json({ error: 'Public key is required' });
        return;
      }

      const signInData = authService.createSignInData(domain!, publicKey);
      res.status(200).json(signInData);
    } catch (error) {
      console.error('Error creating sign-in data:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async verifySignIn(req: Request, res: Response): Promise<void> {
    try {
      const { message, signature, publicKey } = req.body;

      if (!message || !signature || !publicKey) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const result = await authService.verifySignIn(message, signature, publicKey);
      res.status(200).json(result);
    } catch (error) {
      console.error('Error verifying sign-in:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default new AuthController();