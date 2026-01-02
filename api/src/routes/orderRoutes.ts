
import { Router } from 'express';
import {
  createOrder,
  getUserOrders,
  getAllOrders,
  updateOrderStatus,
  updatePaymentStatus,
  cancelOrder,
  requestReturn,
  approveReturn,
  getDashboardStats,
  getMonthlySales
} from '../controllers/orderController';
import { requireAdmin } from '../middleware/adminAuth';
// Import dashboard controllers if needed (based on previous attempt failure context, verify if they exist in imported list)
// imports are lines 3-12. 
// Adding requireAdmin to line 13
import { requireAuth } from '../middleware/auth';
// Removed duplicate imports of dashboard stats and monthly sales

const router = Router();

router.post('/', createOrder);
router.get('/my', requireAuth, getUserOrders); // Protected route for user orders
router.get('/', getUserOrders); // Kept for backward compat (controller handles auth check)
router.get('/all', requireAdmin, getAllOrders);

// Admin Stats - Added manually as they were missing in file view but requested in plan
router.get('/admin/stats', requireAdmin, getDashboardStats);
router.get('/admin/monthly-sales', requireAdmin, getMonthlySales);

// Updated: Separate shipment and payment status updates
router.patch('/:id/order-status', requireAdmin, updateOrderStatus); // Admin - Update shipment status
router.patch('/:id/payment-status', requireAdmin, updatePaymentStatus); // Admin - Update payment status

// Legacy route for backward compatibility
router.patch('/:id/status', requireAdmin, updateOrderStatus);

// PHASE 1: Cancel Order (User)
router.post('/:id/cancel', requireAuth, cancelOrder);

// PHASE 2: Request Return (User)
router.post('/:id/return', requireAuth, requestReturn);

router.patch('/:id/return/approve', requireAdmin, approveReturn);

export default router;


