import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { clerkClient } from '@clerk/express';
import { User } from '../src/models/User';

dotenv.config();

const syncUsers = async () => {
  try {
    if (!process.env.MONGO_URI) throw new Error('MONGO_URI is missing');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🌱 Connected to MongoDB...');

    console.log('🔄 Fetching users from Clerk...');
    const clerkUsers = await clerkClient.users.getUserList({ limit: 100, orderBy: '-created_at' });
    console.log(`✅ Found ${clerkUsers.totalCount} users in Clerk.`);

    let syncedCount = 0;

    for (const user of clerkUsers.data) {
      const email = user.emailAddresses[0]?.emailAddress;
      if (!email) {
        console.warn(`⚠️ User ${user.id} has no email, skipping.`);
        continue;
      }

      await User.findOneAndUpdate(
        { clerkId: user.id },
        {
          $set: {
            email: email,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            isAdmin: user.publicMetadata?.role === 'admin',
            // Do not overwrite addresses or preferences if they exist
          },
          $setOnInsert: {
            addresses: [],
            preferences: { favorite_colors: [], sizes: [] }
          }
        },
        { upsert: true, new: true }
      );
      syncedCount++;
    }

    console.log(`✅ Successfully synced ${syncedCount} users to MongoDB!`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error syncing users:', error);
    process.exit(1);
  }
};

syncUsers();