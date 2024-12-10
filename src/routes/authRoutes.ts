import express from 'express';
import authController from '../controllers/authController';
import { signInLimiter } from '../middleware/rateLimiter';

const router = express.Router();

router.get('/create', signInLimiter, authController.createSignInData);
router.post('/verify', signInLimiter, authController.verifySignIn);

export default router; 