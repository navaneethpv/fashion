import mongoose from 'mongoose';

const CartItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  variantSku: { type: String, required: true }, // To track specific size/color
  quantity: { type: Number, default: 1 },
  price_at_add: { type: Number, required: true }
}, { _id: false });

const CartSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true }, // Clerk ID
  items: [CartItemSchema],
  updatedAt: { type: Date, default: Date.now }
});

export const Cart = mongoose.model('Cart', CartSchema);