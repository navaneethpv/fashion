import { Request, Response } from 'express';
import { Cart } from '../models/Cart';
import { Product } from '../models/Product';

// GET /api/cart?userId=...
export const getCart = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: 'User ID required' });



    const cart = await Cart.findOne({ userId }).populate('items.product', 'name price_cents images slug brand');
    
    if (!cart) return res.json({ items: [] });
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// POST /api/cart
export const addToCart = async (req: Request, res: Response) => {
  try {
    const { userId, productId, variant, quantity } = req.body;

    // 1. Find or Create Cart
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    // 2. Check Product Price (Always fetch fresh price from DB)
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // 3. Check if item exists in cart
    const itemIndex = cart.items.findIndex((item: any) => 
      item.product.toString() === productId && item.variantSku === variant
    );

    if (itemIndex > -1) {
      // Update quantity
      cart.items[itemIndex].quantity += quantity;
    } else {
      // Add new item
      cart.items.push({
        product: productId,
        variantSku: variant,
        quantity,


        price_at_add: product.price_cents
      });
    }

    await cart.save();
    res.json(cart); // Return updated cart
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// DELETE /api/cart
export const removeFromCart = async (req: Request, res: Response) => {
  try {
    const { userId, productId, variant } = req.body;

    const cart = await Cart.findOneAndUpdate(
      { userId },
      { $pull: { items: { product: productId, variantSku: variant } } },
      { new: true }
    );

    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};