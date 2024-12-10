import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import signInRoutes from './routes/signInRoutes';
import healthRoutes from './routes/healthRoutes';

dotenv.config();

export const app = express();

app.set('trust proxy', 1);
app.use(cors());
app.use(express.json());

app.use('/api/v1/claim', signInRoutes);
app.use('/health', healthRoutes);

if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}