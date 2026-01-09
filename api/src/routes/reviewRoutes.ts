import { Router } from 'express';
import { createReview, getReviews, getUserReviews } from '../controllers/productController'; // Use productController for simplicity

const router = Router();

router.post('/', createReview); // POST /api/reviews
router.get('/:productId', getReviews); // GET /api/reviews/:productId
router.get('/user/:userId', getUserReviews); // GET /api/reviews/user/:userId

export default router;