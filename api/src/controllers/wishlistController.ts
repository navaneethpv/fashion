import { Request, Response } from 'express';
import Wishlist from '../models/Wishlist';
import Product from '../models/Product';

/**
 * Add product to wishlist
 * POST /api/wishlist/add
 */
export const addToWishlist = async (req: Request, res: Response) => {
    try {
        const { userId, productId } = req.body;

        if (!userId || !productId) {
            return res.status(400).json({ message: 'userId and productId are required' });
        }

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Try to create wishlist item (will fail if duplicate due to unique index)
        try {
            const wishlistItem = await Wishlist.create({
                userId,
                productId,
            });

            res.status(201).json({
                message: 'Product added to wishlist',
                wishlistItem,
            });
        } catch (error: any) {
            // Duplicate key error (product already in wishlist)
            if (error.code === 11000) {
                return res.status(400).json({ message: 'Product already in wishlist' });
            }
            throw error;
        }
    } catch (error: any) {
        console.error('Add to wishlist error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Remove product from wishlist
 * DELETE /api/wishlist/remove/:productId
 */
export const removeFromWishlist = async (req: Request, res: Response) => {
    try {
        const { productId } = req.params;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ message: 'userId is required' });
        }

        const result = await Wishlist.findOneAndDelete({
            userId,
            productId,
        });

        if (!result) {
            return res.status(404).json({ message: 'Wishlist item not found' });
        }

        res.json({ message: 'Product removed from wishlist' });
    } catch (error: any) {
        console.error('Remove from wishlist error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Get user's wishlist
 * GET /api/wishlist
 */
export const getWishlist = async (req: Request, res: Response) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ message: 'userId is required' });
        }

        const wishlistItems = await Wishlist.find({ userId })
            .populate('productId')
            .sort({ createdAt: -1 })
            .lean();

        // Filter out items where product might have been deleted
        const validItems = wishlistItems.filter(item => item.productId);

        res.json({
            wishlist: validItems,
            count: validItems.length,
        });
    } catch (error: any) {
        console.error('Get wishlist error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
