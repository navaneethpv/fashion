import mongoose from 'mongoose';

const StorySchema = new mongoose.Schema({
    userId: { type: String, required: true }, // Clerk ID
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },

    imageUrl: { type: String, required: true },
    caption: { type: String, maxlength: 500 },

    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },

    likes: [{
        userId: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }],

    expiresAt: {
        type: Date,
        required: true,
        default: () => new Date(+new Date() + 24 * 60 * 60 * 1000) // 24 hours from now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual populate for User info
StorySchema.virtual('user', {
    ref: 'User',
    localField: 'userId', // Story.userId (clerkId)
    foreignField: 'clerkId', // User.clerkId
    justOne: true
});

// Index for getting active stories for a product
StorySchema.index({ productId: 1, status: 1, expiresAt: 1 });

// Index for home page "Styled by Customers" (recent approved stories)
StorySchema.index({ status: 1, expiresAt: 1, createdAt: -1 });

export const Story = mongoose.model('Story', StorySchema);
