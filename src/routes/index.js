import express from 'express';
import authRoutes from './authRoutes.js';
import collegeRoutes from './collegeRoutes.js';
import reviewRoutes from './reviewRoutes.js';
import userRoutes from './userRoutes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/colleges', collegeRoutes);
router.use('/reviews', reviewRoutes);
router.use('/users', userRoutes);

export default router;
