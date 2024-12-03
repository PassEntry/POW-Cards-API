const authService = require('../services/authService');

class AuthController {
    createSignInData(req, res) {
        try {
            const signInData = authService.createSignInData(req.headers.host);
            res.status(200).json(signInData);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

module.exports = new AuthController(); 