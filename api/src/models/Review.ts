import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true }, // Clerk ID
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
  userName: { type: String, required: true },
  userAvatar: { type: String },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true, trim: true, maxlength: 500 },
  photos: [{ type: String }], // URLs for photo evidence
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Prevent duplicate reviews for the same product in a specific order
ReviewSchema.index({ userId: 1, productId: 1, orderId: 1 }, { unique: true });

export const Review = mongoose.model('Review', ReviewSchema);