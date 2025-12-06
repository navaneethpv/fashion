import { Router } from 'express';
import { createOrder, getUserOrders, getAllOrders } from '../controllers/orderController';

const router = Router();

router.post('/', createOrder);
router.get('/', getUserOrders); // ?userId=...
router.get('/all', getAllOrders); // Admin route

export default router;