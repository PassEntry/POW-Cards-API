const express = require('express');
const router = express.Router();
const signInRoutes = require('./signInRoutes');

router.use('/sign-in', signInRoutes);

module.exports = router; 