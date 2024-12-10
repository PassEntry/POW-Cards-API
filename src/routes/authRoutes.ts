import express from 'express';
import authController from '../controllers/authController';
import { signInLimiter } from '../middleware/rateLimiter';

const router = express.Router();

// Apply rate limiting and use the singleton instance directly
router.get('/create', signInLimiter, authController.createSignInData);
router.post('/verify', signInLimiter, authController.verifySignIn);

export default router; 