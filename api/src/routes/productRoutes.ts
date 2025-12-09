// /api/src/routes/productRoutes.ts

import express from 'express';
import {
    getProducts,
    getProductBySlug,
    createProduct,
    deleteProduct,
    getProductByIdAdmin,
    updateProduct,
    createReview, // Assuming you have review routes here
    getReviews
} from '../controllers/productController';
import { upload } from '../config/multer'; // Assuming multer is configured for file uploads

// Simple local clerkAuth middleware to avoid missing module error.
// Replace this with your real Clerk integration (token verification, user attach, etc.).
import { Request, Response, NextFunction } from 'express';
export const clerkAuth = (req: Request, res: Response, next: NextFunction) => {
    const auth = req.headers.authorization;
    if (!auth) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    // TODO: validate token and attach user to req (e.g., req.user = decodedUser)
    next();
};

const router = express.Router();

// --- Public Routes ---
router.get('/', getProducts);
router.get('/slug/:slug', getProductBySlug);
router.get('/reviews/:productId', getReviews);

// --- Authenticated User Routes ---
// Protecting review creation so only logged-in users can post
router.post('/reviews', clerkAuth, createReview); 

// --- Admin-Only Routes ---
// You would typically have an admin-specific middleware here,
// but for now, we can protect them with the general clerkAuth.
router.post('/', clerkAuth, upload.array('images'), createProduct);
router.get('/admin/:id', clerkAuth, getProductByIdAdmin);
router.put('/:id', clerkAuth, updateProduct);
router.delete('/:id', clerkAuth, deleteProduct);

export default router;