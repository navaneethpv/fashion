import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  clerkId: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  firstName: { type: String },
  lastName: { type: String },
  isAdmin: { type: Boolean, default: false },
  role: {
    type: String,
    enum: ["super_admin", "admin", "customer"],
    default: "customer"
  },
  preferences: {
    favorite_colors: [String],
    sizes: [String]
  },
  addresses: [{
    name: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    district: { type: String, required: true },
    state: { type: String, required: true },
    zip: { type: String, required: true },
    country: { type: String, default: 'India' },
    phone: { type: String, required: true },
    type: { type: String, enum: ['Home', 'Work', 'Other'], default: 'Home' },
    isDefault: { type: Boolean, default: false }
  }],
  lastSeenAt: { type: Date, default: null },
  isOnline: { type: Boolean, default: false }
}, { timestamps: true });

export const User = mongoose.model('User', UserSchema);