"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const authService_1 = __importDefault(require("../services/authService"));
class AuthController {
    createSignInData(req, res) {
        try {
            const domain = req.headers.host;
            const publicKey = req.query.publicKey;
            if (!publicKey) {
                res.status(400).json({ error: 'Public key is required' });
                return;
            }
            const signInData = authService_1.default.createSignInData(domain, publicKey);
            res.status(200).json(signInData);
        }
        catch (error) {
            console.error('Error creating sign-in data:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    async verifySignIn(req, res) {
        try {
            const { message, signature, publicKey } = req.body;
            if (!message || !signature || !publicKey) {
                res.status(400).json({ error: 'Missing required fields' });
                return;
            }
            const result = await authService_1.default.verifySignIn(message, signature, publicKey);
            res.status(200).json(result);
        }
        catch (error) {
            console.error('Error verifying sign-in:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
exports.AuthController = AuthController;
exports.default = new AuthController();
