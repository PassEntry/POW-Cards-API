const authService = require('../services/authService');

class AuthController {
    createSignInData(req, res) {
        try {
            const domain = req.headers.host;
            const publicKey = req.query.publicKey;

            if (!publicKey) {
                return res.status(400).json({ error: 'Public key is required' });
            }

            const signInData = authService.createSignInData(domain, publicKey);
            res.status(200).json(signInData);
        } catch (error) {
            console.error('Error creating sign-in data:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async verifySignIn(req, res) {
        try {
            const { message, signature, publicKey } = req.body;
            
            if (!message || !signature || !publicKey) {
                return res.status(400).json({ 
                    verified: false,
                    error: 'Missing required fields' 
                });
            }

            const result = await authService.verifySignIn(message, signature, publicKey);
            
            if (!result.verified) {
                return res.status(401).json({
                    verified: false,
                    error: result.reason
                });
            }

            res.status(200).json({
                verified: true
            });
        } catch (error) {
            console.error('Sign-in verification error:', error);
            res.status(500).json({ 
                verified: false,
                error: 'Internal server error' 
            });
        }
    }
}

module.exports = new AuthController(); 