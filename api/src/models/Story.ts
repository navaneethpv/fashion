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
        default: 'pending' // Default to pending if we want manual review, but typically AI verified -> approved?
        // Requirement says: "status: approved | pending | rejected"
        // "Accept if response === YES". So if AI says YES, we can Auto-Approve?
        // "Admin can moderate stories".
        // Let's set to 'approved' if AI says YES, 'rejected' if NO. 
        // Maybe 'pending' is for explicit manual review?
        // I'll stick to 'approved' if AI verifies it.
    },

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
