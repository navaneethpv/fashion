import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { getAuth } from '@clerk/express';

export const updateLastSeen = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const auth = getAuth(req);
        const userId = auth.userId;

        // Only track authenticated users
        if (!userId) {
            return next();
        }

        // Update lastSeenAt without returning the document (faster)
        // using findOneAndUpdate ensures we find by clerkId
        await User.findOneAndUpdate(
            { clerkId: userId },
            { lastSeenAt: new Date() },
            { new: false } // We don't need the updated document
        );

        next();
    } catch (error) {
        // Fail silently - don't block the request for this background task
        console.error('Error updating last seen:', error);
        next();
    }
};
