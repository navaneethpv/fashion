
import { Router } from 'express';
import { getDashboardStats, getMonthlySales } from '../controllers/orderController';
import { User } from '../models/User';

const router = Router();

router.get('/stats', getDashboardStats);
router.get('/monthly-sales', getMonthlySales);

// Simple User List
router.get('/users', async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });

  const formattedUsers = users.map(user => {
    const firstName = user.firstName?.trim();
    const lastName = user.lastName?.trim();

    return {
      id: user._id,
      name:
        firstName || lastName
          ? `${firstName ?? ""} ${lastName ?? ""}`.trim()
          : "—",
      email: user.email,
      role: user.isAdmin ? "Administrator" : "Customer",
      joined: user.createdAt.toLocaleDateString(),
      lastSeenAt: user.lastSeenAt || null,
    };
  });

  res.json({ users: formattedUsers });
});

export default router;
