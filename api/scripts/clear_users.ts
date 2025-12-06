import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../src/models/User';

dotenv.config();

const clearUsers = async () => {
  try {
    if (!process.env.MONGO_URI) throw new Error('MONGO_URI is missing');
    await mongoose.connect(process.env.MONGO_URI);
    
    console.log('🧹 Clearing ALL users from MongoDB...');
    await User.deleteMany({});
    
    console.log('✅ Users deleted. Please log in again on the frontend to sync your Admin account.');
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

clearUsers();