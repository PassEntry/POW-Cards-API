import express from 'express';
import signInRoutes from './claimRoutes';

const router = express.Router();

router.use('/sign-in', signInRoutes);

export default router;
