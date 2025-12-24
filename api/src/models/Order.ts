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
  userId: { type: String, required: true },
  items: [OrderItemSchema],
  total_cents: { type: Number, required: true },

  // Legacy status field for backward compatibility
  status: {
    type: String,
    enum: ['pending', 'paid', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },

  // New separated status fields
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },

  orderStatus: {
    type: String,
    enum: ['placed', 'confirmed', 'shipped', 'delivered', 'cancelled'],
    default: 'placed'
  },

  paymentInfo: {
    id: String,
    status: String,
    method: String
  },

  // More detailed address schema
  shippingAddress: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zip: { type: String, required: true },
    country: { type: String, default: 'US' }
  }
}, { timestamps: true });

export const Order = mongoose.model('Order', OrderSchema);