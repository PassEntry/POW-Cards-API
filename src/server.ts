import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';

// Load environment variables
dotenv.config();

export const app = express();

// Add trust proxy setting before other middleware
app.set('trust proxy', 1);

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/v1/sign-in', authRoutes);

if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}