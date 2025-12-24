

import { Request, Response } from 'express';
import { Order } from '../models/Order';
import { Cart } from '../models/Cart';
import { User } from '../models/User';
import { Product } from '../models/Product';
import {
  validateCreateOrderRequest,
  handleCartError,
  calculateOrderTotal,
  ValidationError
} from '../utils/validation';
import {
  CreateOrderRequest,
  CreateOrderResponse,
  OrderStatusUpdateResponse
} from '../types/order';



// POST /api/orders
export const createOrder = async (req: Request, res: Response) => {
  try {
    // Validate and parse request body
    const validatedRequest: CreateOrderRequest = validateCreateOrderRequest(req.body);

    // Fetch user's cart to validate and calculate prices server-side
    const cart = await Cart.findOne({ userId: validatedRequest.userId })
      .populate('items.product', 'name price_cents images')
      .lean();

    if (!cart || !cart.items.length) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Cart is empty or not found'
      });
    }


    // Calculate order items with snapshot prices from cart
    const orderItems = cart.items.map((cartItem: any) => {
      if (!cartItem.product) {
        throw new ValidationError(`Product not found for cart item`);
      }

      return {
        productId: cartItem.product._id.toString(),
        name: cartItem.product.name,
        variantSku: cartItem.variantSku,
        quantity: cartItem.quantity,
        price_cents: cartItem.price_at_add, // Use snapshot price from cart
        image: cartItem.product.images?.[0]?.url || '' // Extract URL string from Cloudinary object
      };
    });

    // Calculate total from cart items (server-side validation)
    const calculatedTotal = calculateOrderTotal(orderItems);

    // Validate against requested total if provided
    if (validatedRequest.total_cents && validatedRequest.total_cents !== calculatedTotal) {
      return res.status(400).json({
        error: 'Price Mismatch',
        message: 'Calculated total does not match requested total',
        field: 'total_cents'
      });
    }


    // Create order with validated data
    // After successful Stripe payment, set paymentStatus to "Paid" and orderStatus to "Placed"
    const orderData = {
      userId: validatedRequest.userId,
      items: orderItems,
      total_cents: calculatedTotal,
      shippingAddress: validatedRequest.shippingAddress,
      status: 'paid' as const, // Legacy field
      paymentStatus: 'paid' as const, // Payment confirmed
      orderStatus: 'placed' as const, // Order created
      paymentInfo: {
        method: 'credit_card',
        status: 'succeeded',
        id: `mock_pay_${Date.now()}`
      }
    };

    const newOrder = new Order(orderData);
    const savedOrder = await newOrder.save();

    // Clear cart after successful order
    await Cart.findOneAndUpdate(
      { userId: validatedRequest.userId },
      { $set: { items: [] } }
    );




    // Return saved order (Mongoose document with proper conversion)
    res.status(201).json(savedOrder);
  } catch (error) {
    console.error('Create Order Error:', error);

    if (error instanceof ValidationError) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.message,
        field: error.field
      });
    }

    handleCartError(error, res);
  }
};

export const getUserOrders = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query as { userId: string };
    if (!userId) {
      return res.status(400).json({ message: "UserId is required" });
    }
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to retrieve orders' });
  }
};

// GET /api/orders/all (Admin)
export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
};


// GET /api/admin/stats
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    // 1. Total Revenue (exclude cancelled orders, use paymentStatus for accuracy)
    const revenueAgg = await Order.aggregate([
      { $match: { paymentStatus: 'paid', orderStatus: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$total_cents' } } }
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;

    // 2. Counts (exclude cancelled)
    const totalOrders = await Order.countDocuments({ orderStatus: { $ne: 'cancelled' } });
    const totalProducts = await Product.countDocuments();
    const totalUsers = await User.countDocuments();

    // 3. Recent Orders (exclude cancelled)
    const recentOrders = await Order.find({ orderStatus: { $ne: 'cancelled' } })
      .sort({ createdAt: -1 }).limit(5);

    // 4. Payment Status breakdown
    const paymentStatusStats = await Order.aggregate([
      {
        $group: {
          _id: '$paymentStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    // 5. Order Status breakdown
    const orderStatusStats = await Order.aggregate([
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      revenue: totalRevenue,
      orders: totalOrders,
      products: totalProducts,
      users: totalUsers,
      recentOrders,
      paymentStatusBreakdown: paymentStatusStats,
      orderStatusBreakdown: orderStatusStats
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Stats error' });
  }
};


// PATCH /api/orders/:id/order-status (Admin - Update shipment status only)
export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { orderStatus } = req.body;

    const validOrderStatuses = ['placed', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!validOrderStatuses.includes(orderStatus)) {
      return res.status(400).json({ message: 'Invalid order status' });
    }

    // Find the order first to check if it exists
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Ensure payment is completed before allowing shipment status changes
    if (order.paymentStatus !== 'paid' && orderStatus !== 'cancelled') {
      // allow if it was 'Paid' (legacy case check?) no, we enforced lowercase.
      return res.status(400).json({
        message: 'Cannot update shipment status: payment not completed',
        currentPaymentStatus: order.paymentStatus
      });
    }

    // Update order status (shipment status)
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      {
        orderStatus,
        // Update legacy status for backward compatibility
        status: orderStatus === 'cancelled' ? 'cancelled' :
          orderStatus === 'shipped' ? 'shipped' :
            orderStatus === 'delivered' ? 'delivered' : 'paid'
      },
      { new: true }
    );

    res.json(updatedOrder);
  } catch (error) {
    console.error('Update Order Status Error:', error);
    res.status(500).json({ message: 'Failed to update order status' });
  }
};

// PATCH /api/orders/:id/payment-status (Admin - Update payment status only)
export const updatePaymentStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;

    const validPaymentStatuses = ['pending', 'paid', 'failed', 'refunded'];
    if (!validPaymentStatuses.includes(paymentStatus)) {
      return res.status(400).json({ message: 'Invalid payment status' });
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { paymentStatus },
      { new: true }
    );

    if (!order) return res.status(404).json({ message: 'Order not found' });

    res.json(order);
  } catch (error) {
    console.error('Update Payment Status Error:', error);
    res.status(500).json({ message: 'Failed to update payment status' });
  }
};


// GET /api/admin/monthly-sales
export const getMonthlySales = async (req: Request, res: Response) => {
  try {
    const { year = new Date().getFullYear() } = req.query;

    // Use paymentStatus for revenue calculations (only paid orders contribute to revenue)
    const monthlySales = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(`${year}-01-01`),
            $lt: new Date(`${parseInt(year as string) + 1}-01-01`)
          },
          paymentStatus: 'paid',
          orderStatus: { $ne: 'cancelled' } // Exclude cancelled orders
        }
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          totalSales: { $sum: '$total_cents' },
          orderCount: { $sum: 1 }
        }
      },
      {
        $project: {
          month: '$_id',
          totalSales: 1,
          orderCount: 1,
          _id: 0
        }
      },
      {
        $sort: { month: 1 }
      }
    ]);

    // Fill in missing months with 0 values
    const completeMonthlyData = [];
    for (let i = 1; i <= 12; i++) {
      const monthData = monthlySales.find(m => m.month === i);
      completeMonthlyData.push({
        month: i,
        totalSales: monthData?.totalSales || 0,
        orderCount: monthData?.orderCount || 0
      });
    }

    res.json({
      year: parseInt(year as string),
      monthlySales: completeMonthlyData
    });

  } catch (error) {
    console.error('Monthly Sales Error:', error);
    res.status(500).json({ message: 'Failed to fetch monthly sales' });
  }
};
