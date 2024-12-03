const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.get('/createSignInData', authController.createSignInData.bind(authController));

module.exports = router; 