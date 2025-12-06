import { Router } from 'express';
import { getProducts, getProductBySlug, createProduct, deleteProduct } from '../controllers/productController';
import { upload } from '../config/multer';

const router = Router();

router.get('/', getProducts);
// ⚠️ CRUCIAL: 'image' must match the form.append key from the frontend
router.post('/', upload.single('image'), createProduct); 
router.get('/:slug', getProductBySlug);
router.delete('/:id', deleteProduct);

export default router;