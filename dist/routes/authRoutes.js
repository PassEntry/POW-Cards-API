"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = express_1.default.Router();
const authController = new authController_1.AuthController();
// Apply rate limiting and bind the controller methods
router.get('/create', rateLimiter_1.signInLimiter, authController.createSignInData.bind(authController));
router.post('/verify', rateLimiter_1.signInLimiter, authController.verifySignIn.bind(authController));
exports.default = router;
