"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
// Load environment variables
dotenv_1.default.config();
exports.app = (0, express_1.default)();
// Add trust proxy setting before other middleware
exports.app.set('trust proxy', 1);
// Enable CORS and JSON parsing
exports.app.use((0, cors_1.default)());
exports.app.use(express_1.default.json());
// Routes
exports.app.use('/api/v1/sign-in', authRoutes_1.default);
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    exports.app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}
