
import { Router } from 'express';
import { getDashboardStats, getMonthlySales } from '../controllers/orderController';
import { User } from '../models/User';

const router = Router();

router.get('/stats', getDashboardStats);
router.get('/monthly-sales', getMonthlySales);

// Utility to calculate time ago
function formatLastSeen(date: Date) {
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "Online";
  if (minutes < 60) return `Last seen ${minutes} min ago`;
  if (hours < 24) return `Last seen ${hours} hours ago`;
  if (days <= 3) return `Last seen ${days} days ago`;

  return `Last seen on ${date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}

// Simple User List
router.get('/users', async (req, res) => {
  const users = await User.find().sort({ lastSeenAt: -1 });

  const formattedUsers = users.map(user => {
    const firstName = user.firstName?.trim();
    const lastName = user.lastName?.trim();

    const lastSeen = user.lastSeenAt
      ? formatLastSeen(user.lastSeenAt)
      : "Never";

    return {
      id: user._id,
      name:
        firstName || lastName
          ? `${firstName ?? ""} ${lastName ?? ""}`.trim()
          : "—",
      email: user.email,
      role: user.isAdmin ? "Administrator" : "Customer",
      joined: user.createdAt.toLocaleDateString(),
      lastSeen,
      isOnline: user.lastSeenAt
        ? Date.now() - user.lastSeenAt.getTime() < 2 * 60 * 1000
        : false,
    };
  });

  res.json({ users: formattedUsers });
});

export default router;
