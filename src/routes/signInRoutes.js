const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Changed from '/createSignInData' to '/create'
router.get('/create', authController.createSignInData.bind(authController));

module.exports = router; 