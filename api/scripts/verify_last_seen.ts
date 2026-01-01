import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../src/models/User';

dotenv.config();

const simulateActivity = async () => {
    try {
        if (!process.env.MONGO_URI) throw new Error('MONGO_URI is missing');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('🌱 Connected to MongoDB...');

        // 1. Set one user to "Online" (active now) - likely the admin but let's pick another
        // actually admin is always online when viewing.

        // 2. Set one user to "Last seen 5 mins ago"
        const user5Min = await User.findOneAndUpdate(
            { email: { $regex: /@/ } }, // Pick any user
            { lastSeenAt: new Date(Date.now() - 5 * 60 * 1000) }, // 5 mins ago
            { new: true }
        );

        if (user5Min) {
            console.log(`✅ Updated ${user5Min.firstName || 'User'} to 'Last seen 5 min ago'`);
        }

        // 3. Set one user to "Last seen 2 hours ago"
        const user2Hour = await User.findOneAndUpdate(
            { _id: { $ne: user5Min?._id } },
            { lastSeenAt: new Date(Date.now() - 2 * 60 * 60 * 1000) }, // 2 hours ago
            { new: true }
        );

        if (user2Hour) {
            console.log(`✅ Updated ${user2Hour.firstName || 'User'} to 'Last seen 2 hr ago'`);
        }

        // 4. Set one user to "Last seen 3 days ago"
        const user3Days = await User.findOneAndUpdate(
            { _id: { $nin: [user5Min?._id, user2Hour?._id] } },
            { lastSeenAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) }, // 3 days ago
            { new: true }
        );

        if (user3Days) {
            console.log(`✅ Updated ${user3Days.firstName || 'User'} to '3 days ago'`);
        }

        console.log('\n🎉 Simulation complete! Refresh your Admin Users page to see these statuses.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error simulating activity:', error);
        process.exit(1);
    }
};

simulateActivity();
