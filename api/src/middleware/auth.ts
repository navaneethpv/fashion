import { clerkMiddleware, requireAuth as clerkRequireAuth } from '@clerk/express';

// Export the middleware to be used in the app
export const requireAuth = clerkRequireAuth();

// Optional: If you need custom logic later, you can wrap it
// export const requireAuth = (req, res, next) => {
//   // Custom logic
//   return clerkRequireAuth()(req, res, next);
// };
