import express from 'express';
import { AuthController } from '../controllers/authController';
import { claimLimiter } from '../middleware/rateLimiter';

const router = express.Router();
const authController = new AuthController();

router.get('/init', claimLimiter, authController.createSignInData.bind(authController));
router.post('/wallet-pass', claimLimiter, authController.verifySignIn.bind(authController));

export default router; 