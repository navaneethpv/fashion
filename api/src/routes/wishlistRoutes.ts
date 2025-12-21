import express from 'express';
import { addToWishlist, removeFromWishlist, getWishlist } from '../controllers/wishlistController';

const router = express.Router();

// Add to wishlist
router.post('/add', addToWishlist);

// Remove from wishlist
router.delete('/remove/:productId', removeFromWishlist);

// Get user's wishlist
router.get('/', getWishlist);

export default router;
