import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import healthRoutes from './routes/healthRoutes';
import claimRoutes from './routes/claimRoutes';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const app = express();

app.set('trust proxy', 1);
app.use(cors());
app.use(express.json());

app.use('/api/v1/claim', claimRoutes);
app.use('/health', healthRoutes);

app.get('/test', (req, res) => {
    res.json({ message: 'Test route working' });
});

if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}