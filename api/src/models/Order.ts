import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name: { type: String, required: true },
  variantSku: { type: String },
  quantity: { type: Number, required: true },
  price_cents: { type: Number, required: true },
  image: { type: String }
});

const OrderSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // Clerk ID
  items: [OrderItemSchema],
  total_cents: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'paid', 'shipped', 'delivered', 'cancelled'], 
    default: 'pending' 
  },
  paymentInfo: {
    id: String,
    status: String,
    method: String
  },
  shippingAddress: {
    street: String,
    city: String,
    zip: String,
    country: String
  }
}, { timestamps: true });

export const Order = mongoose.model('Order', OrderSchema);
