import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true }, // Clerk ID
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true, trim: true, maxlength: 500 },
  photos: [{ type: String }], // URLs for photo evidence
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

export const Review = mongoose.model('Review', ReviewSchema);