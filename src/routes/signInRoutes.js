const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { signInLimiter } = require('../middleware/rateLimiter');

router.get('/create', signInLimiter, authController.createSignInData.bind(authController));
router.post('/verify', signInLimiter, authController.verifySignIn.bind(authController));

module.exports = router; 