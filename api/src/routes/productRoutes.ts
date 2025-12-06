import { Router } from 'express';
import { getProducts, getProductBySlug, createProduct } from '../controllers/productController';

const router = Router();

router.get('/', getProducts);
router.post('/', createProduct); // <--- Add this (Admin only in real app)
router.get('/:slug', getProductBySlug);

export default router;