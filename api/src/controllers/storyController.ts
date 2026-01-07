
import { Request, Response } from 'express';
import { requireAuth } from '@clerk/express'; // Assuming this exists or I rely on req.auth
import mongoose from 'mongoose';
import { Story } from '../models/Story';
import { Order } from '../models/Order';
import { Product } from '../models/Product';
import { verifyStoryImage } from '../utils/storyVerificationAI';
import imagekit from '../config/imagekit';

// Upload helper - copied from productController for stability
function uploadToImageKit(buffer: Buffer, filename: string, folder: string = "/stories"): Promise<string> {
    return new Promise((resolve, reject) => {
        imagekit.upload(
            {
                file: buffer,
                fileName: filename,
                folder: folder,
            },
            (err, result) => {
                if (err) {
                    console.error("ImageKit Upload Error:", err);
                    return reject(err);
                }
                if (result && result.url) {
                    resolve(result.url);
                } else {
                    reject(new Error("ImageKit upload failed: No URL returned"));
                }
            }
        );
    });
}

export const createStory = async (req: Request, res: Response) => {
    try {
        const { userId } = (req as any).auth;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const { orderId, productId, caption } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ message: "Image is required" });
        }
        if (!orderId || !productId) {
            return res.status(400).json({ message: "Order ID and Product ID are required" });
        }

        // Validate IDs
        if (!mongoose.Types.ObjectId.isValid(orderId) || !mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ message: "Invalid ID format" });
        }

        // 1. Verify Order
        const order = await Order.findOne({
            _id: orderId,
            userId: userId,
            // Check for delivered status (legacy or new field)
            $or: [
                { status: 'delivered' },
                { orderStatus: 'delivered' }
            ]
        });

        if (!order) {
            return res.status(404).json({ message: "Order not found or not delivered." });
        }

        // 2. Verify Product in Order
        const hasProduct = order.items.some((item: any) =>
            item.productId.toString() === productId || item._id?.toString() === productId
        );
        // Note: Logic above handles both regular product ID refs and embedded item IDs just in case.
        // But typically we match by `productId` field in the item:
        const orderItem = order.items.find((item: any) =>
            item.productId?.toString() === productId
            // OR checks generic item if `productId` isn't populated (model usually has it)
        );

        if (!orderItem) {
            return res.status(400).json({ message: "This product is not in the specified order." });
        }

        // 3. Get Product (for image reference)
        const product = await Product.findById(productId);
        if (!product || !product.images || product.images.length === 0) {
            return res.status(404).json({ message: "Product reference not found." });
        }

        // 4. Gemini Verification
        const productImageUrl = typeof product.images[0] === 'string'
            ? product.images[0]
            : (product.images[0] as any).url;

        if (!productImageUrl) {
            return res.status(500).json({ message: "Reference product has no image." });
        }

        const isVerified = await verifyStoryImage(productImageUrl, file.buffer, file.mimetype);

        if (!isVerified) {
            return res.status(400).json({
                message: "We couldn’t detect the purchased product clearly in this image. Please try again with a clearer photo."
            });
        }

        // 5. Upload to ImageKit
        const filename = `story-${userId}-${productId}-${Date.now()}.jpg`;
        const uploadedUrl = await uploadToImageKit(file.buffer, filename);

        // 6. Save Story
        const story = await Story.create({
            userId,
            productId,
            orderId,
            imageUrl: uploadedUrl,
            caption: caption || "",
            status: "approved", // Auto-approve as per plan since verified by AI
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        });

        res.status(201).json(story);

    } catch (error: any) {
        console.error("[CreateStory] Error:", error);
        res.status(500).json({ message: "Server error creating story.", error: error.message });
    }
};

export const getStories = async (req: Request, res: Response) => {
    try {
        const { productId } = req.query;
        const query: any = {
            status: 'approved',
            expiresAt: { $gt: new Date() }
        };

        if (productId) {
            query.productId = productId;
        }

        // Sorting by newest
        const stories = await Story.find(query)
            .sort({ createdAt: -1 })
            .limit(50)
            .populate('productId', 'name price_cents price_before_cents slug images')
            .populate('user', 'firstName lastName');

        // If needed, populate User info (assuming we have a User model or just store basic info).
        // Since User is in Clerk, we might not maintain a full User collection or it might be synced.
        // For now, return stories as is. Frontend can show "Verified Buyer".


        // Debug logging
        if (stories.length > 0) {
            console.log("[GetStories] First story product sample:", JSON.stringify(stories[0].productId, null, 2));
        }

        // Add hasLiked flag for current user
        const currentUserId = (req as any).auth?.userId;
        const storiesWithLikeStatus = stories.map((story: any) => {
            const storyObj = story.toObject();
            storyObj.hasLiked = currentUserId ? story.likes?.some((like: any) => like.userId === currentUserId) : false;
            // Don't send full likes array to public to keep it private
            delete storyObj.likes;
            return storyObj;
        });

        res.json(storiesWithLikeStatus);
    } catch (error: any) {
        console.error("[GetStories] Error:", error);
        res.status(500).json({ message: "Server error fetching stories.", error: error.message });
    }
};

export const toggleLike = async (req: Request, res: Response) => {
    try {
        const { userId } = (req as any).auth;
        const { id } = req.params;

        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const story = await Story.findById(id);
        if (!story) return res.status(404).json({ message: "Story not found" });

        const existingLikeIndex = story.likes.findIndex((like: any) => like.userId === userId);

        if (existingLikeIndex > -1) {
            // Unlike
            story.likes.splice(existingLikeIndex, 1);
        } else {
            // Like
            story.likes.push({ userId, createdAt: new Date() });
        }

        await story.save();
        res.json({ success: true, liked: existingLikeIndex === -1 });
    } catch (error: any) {
        console.error("[ToggleLike] Error:", error);
        res.status(500).json({ message: "Server error toggling like." });
    }
};

export const getStoryLikes = async (req: Request, res: Response) => {
    try {
        const { userId } = (req as any).auth;
        const { id } = req.params;

        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const story = await Story.findById(id);
        if (!story) return res.status(404).json({ message: "Story not found" });

        // Privacy check: Only owner can see likes
        if (story.userId !== userId) {
            return res.status(403).json({ message: "Only the story owner can view likes." });
        }

        // Get user details for the likes
        // We have Clerk IDs in story.likes.userId
        // We need to fetch from our local User sync or assuming we populate logic.
        // Since we are using virtuals for 'user', we can't easily populate an array of non-ref strings.
        // We have to optimize this. For now let's find Users where clerkId is in the list.

        // Import User model if not already imported? It wasn't in the original file I viewed.
        // Wait, I need to check imports. I'll assume I can dynamic import or add import at top if possible.
        // Actually, replace_file_content at bottom won't add import at top. I should start with adding import if missing.
        // But let's check imports in original file. User was NOT imported. 
        // I will just use mongoose.model('User') to avoid import issues if I can't edit top.
        // OR better, I'll update the whole file logic or add import in a separate step if strict.
        // I'll try to use lazy load for User model to be safe: mongoose.model('User')

        const User = mongoose.model('User');
        const userIds = story.likes.map((l: any) => l.userId);
        const users = await User.find({ clerkId: { $in: userIds } }).select('firstName lastName clerkId');

        // Map back to timestamps
        const likesWithDetails = story.likes.map((like: any) => {
            const user = users.find((u: any) => u.clerkId === like.userId);
            return {
                userId: like.userId,
                createdAt: like.createdAt,
                user: user ? { firstName: user.firstName, lastName: user.lastName } : { firstName: 'Unknown' }
            };
        });

        res.json(likesWithDetails);

    } catch (error: any) {
        console.error("[GetLikes] Error:", error);
        res.status(500).json({ message: "Server error fetching likes." });
    }
};
