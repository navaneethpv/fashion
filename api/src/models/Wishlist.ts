import mongoose, { Document, Schema } from 'mongoose';

export interface IWishlist extends Document {
    userId: string;
    productId: mongoose.Types.ObjectId;
    createdAt: Date;
}

const WishlistSchema = new Schema<IWishlist>(
    {
        userId: {
            type: String,
            required: true,
            index: true,
        },
        productId: {
            type: Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },
    },
    { timestamps: true }
);

// Unique compound index to prevent duplicates
WishlistSchema.index({ userId: 1, productId: 1 }, { unique: true });

export const Wishlist = mongoose.model<IWishlist>('Wishlist', WishlistSchema);
export default Wishlist;
