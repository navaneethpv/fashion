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
import { getSubCategories } from "../controllers/productController";
import { aiSuggestSubCategory } from "../controllers/productController";


const router = express.Router();


// --- Public Routes ---
router.get('/', getProducts);
router.get('/slug/:slug', getProductBySlug);
router.get('/reviews/:productId', getReviews);
router.get('/subcategories', getSubCategories);

// --- Authenticated User Routes ---
// Protecting review creation so only logged-in users can post
router.post('/reviews', createReview); 

// --- Admin-Only Routes ---
// You would typically have an admin-specific middleware here,
// but for now, we can protect them with the general clerkAuth.
router.post('/', upload.array('images'), createProduct);
router.get('/admin/:id', getProductByIdAdmin);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);


router.post(
  "/ai/suggest-category",
  upload.single("image"),
  aiSuggestSubCategory
);



export default router;