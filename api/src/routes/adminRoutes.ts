
import { Router } from 'express';
import { getDashboardStats, getMonthlySales } from '../controllers/orderController';
import { User } from '../models/User';
import { clerkClient } from '@clerk/express';

import { requireAdmin } from '../middleware/adminAuth';

const router = Router();

// Apply admin protection to all routes in this file
router.use(requireAdmin);

router.get('/stats', getDashboardStats);
router.get('/monthly-sales', getMonthlySales);

// Simple User List
router.get('/users', async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });

  const formattedUsers = users.map(user => {
    const firstName = user.firstName?.trim();
    const lastName = user.lastName?.trim();
    const isOnline = user.isOnline; // DIRECT FROM DB

    return {
      id: user._id,
      name:
        firstName || lastName
          ? `${firstName ?? ""} ${lastName ?? ""}`.trim()
          : "—",
      email: user.email,
      role: user.role === 'admin' || user.role === 'super_admin' ? "Administrator" : "Customer",
      joined: user.createdAt.toLocaleDateString(),
      lastSeenAt: user.lastSeenAt || null,
      isOnline,
    };
  });

  res.json({ users: formattedUsers });
});

export default router;
