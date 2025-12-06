import { Router } from 'express';
import { getDashboardStats } from '../controllers/orderController';
import { User } from '../models/User';

const router = Router();

router.get('/stats', getDashboardStats);

// Simple User List
router.get('/users', async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json(users);
});

export default router;