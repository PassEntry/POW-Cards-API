import express from 'express';
import { AuthController } from '../controllers/authController';
import { signInLimiter } from '../middleware/rateLimiter';

const router = express.Router();
const authController = new AuthController();

router.get('/init', signInLimiter, authController.createSignInData.bind(authController));
router.post('/wallet-pass', signInLimiter, authController.verifySignIn.bind(authController));

export default router;