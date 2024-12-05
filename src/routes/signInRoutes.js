const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.get('/create', authController.createSignInData.bind(authController));
router.post('/verify', authController.verifySignIn.bind(authController));

module.exports = router; 