import rateLimit from 'express-rate-limit';

export const claimLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many claim attempts, please try again later'
    }
});
