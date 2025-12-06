import { Request, Response } from 'express';
import { Order } from '../models/Order';
import { Cart } from '../models/Cart';

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
