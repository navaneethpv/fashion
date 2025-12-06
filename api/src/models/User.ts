import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  clerkId: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  firstName: { type: String },
  lastName: { type: String },
  isAdmin: { type: Boolean, default: false },
  preferences: {
    favorite_colors: [String],
    sizes: [String]
  }
}, { timestamps: true });

export const User = mongoose.model('User', UserSchema);