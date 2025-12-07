import { Router } from 'express';
import { createReview, getReviews } from '../controllers/productController'; // Use productController for simplicity

const router = Router();

router.post('/', createReview); // POST /api/reviews
router.get('/:productId', getReviews); // GET /api/reviews/:productId

export default router;