import { Request, Response } from 'express';
import { Order } from '../models/Order';
import { Cart } from '../models/Cart';
import { User } from '../models/User';
import { Product } from '../models/Product';

// POST /api/orders
// ... imports

export const createOrder = async (req: Request, res: Response) => {
  try {
    // We expect shippingAddress to contain all the new fields now
    const { userId, items, total_cents, shippingAddress } = req.body;

    const newOrder = new Order({
      userId,
      items,
      total_cents,
      shippingAddress, // Mongoose will validate the fields inside here
      status: 'paid',
      paymentInfo: {
        method: 'credit_card',
        status: 'succeeded',
        id: `mock_pay_${Date.now()}`
      }
    });

    const savedOrder = await newOrder.save();

    await Cart.findOneAndUpdate(
      { userId }, 
      { $set: { items: [] } }
    );

    res.status(201).json(savedOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create order' });
  }
};

export const getUserOrders = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const orders = await Order.find({ userId }).sort({ orderDate: -1 });
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
    // 1. Total Revenue
    const revenueAgg = await Order.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$total_cents' } } }
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;

    // 2. Counts
    const totalOrders = await Order.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalUsers = await User.countDocuments(); // Assuming you sync Clerk users to Mongo

    // 3. Recent Orders
    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5);

    res.json({
      revenue: totalRevenue,
      orders: totalOrders,
      products: totalProducts,
      users: totalUsers,
      recentOrders
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Stats error' });
  }
};

// ... existing imports

// PATCH /api/orders/:id/status
export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await Order.findByIdAndUpdate(
      id, 
      { status }, 
      { new: true } // Return the updated document
    );

    if (!order) return res.status(404).json({ message: 'Order not found' });

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update order' });
  }
};