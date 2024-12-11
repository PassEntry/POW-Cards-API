import express from 'express';
import authController from '../controllers/authController';
import { claimLimiter } from '../middleware/rateLimiter';

const router = express.Router();

router.get('/create', claimLimiter, authController.createSignInData);
router.post('/verify', claimLimiter, authController.verifySignIn);

export default router; 