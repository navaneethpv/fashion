import { Router } from 'express';
import { createOrder, getUserOrders, getAllOrders, updateOrderStatus } from '../controllers/orderController';

const router = Router();

router.post('/', createOrder);
router.get('/', getUserOrders);
router.get('/all', getAllOrders);
router.patch('/:id/status', updateOrderStatus); // <--- NEW

export default router;