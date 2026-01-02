
import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';

export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).auth?.userId;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized: No user logged in' });
        }

        // Fetch user from MongoDB to check role
        const user = await User.findOne({ clerkId: userId });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check Role
        if (user.role === 'admin' || user.role === 'super_admin') {
            // Authorized
            (req as any).user = user; // attach user to req for convenience
            return next();
        } else {
            // Forbidden
            return res.status(403).json({ message: 'Forbidden: Admin access only' });
        }
    } catch (error) {
        console.error('Admin Auth Error:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};
