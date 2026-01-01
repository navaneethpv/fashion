import { clerkClient } from "@clerk/express";
import { User } from "../models/User";

/**
 * Syncs users from Clerk to MongoDB.
 * Creates missing users but DOES NOT overwrite existing ones.
 */
export const syncClerkUsers = async () => {
    try {
        // Fetch latest 100 users from Clerk
        const clerkUsers = await clerkClient.users.getUserList({
            limit: 100,
            orderBy: '-created_at',
        });

        let newUsersCount = 0;

        for (const clerkUser of clerkUsers.data) {
            // Check if user already exists
            const exists = await User.exists({ clerkId: clerkUser.id });

            if (!exists) {
                const primaryEmail = clerkUser.emailAddresses.find(
                    (email) => email.id === clerkUser.primaryEmailAddressId
                )?.emailAddress;

                if (primaryEmail) {
                    await User.create({
                        clerkId: clerkUser.id,
                        email: primaryEmail,
                        firstName: clerkUser.firstName,
                        lastName: clerkUser.lastName,
                        isAdmin: false,
                        // Initialize lastSeenAt effectively to avoid "Never"
                        lastSeenAt: new Date()
                    });
                    newUsersCount++;
                }
            }
        }

        if (newUsersCount > 0) {
            console.log(`✅ Auto-Sync: Created ${newUsersCount} new users from Clerk.`);
        }
    } catch (error) {
        console.error("❌ Auto-Sync Error:", error);
        // Don't throw, just log to keep server alive
    }
};
