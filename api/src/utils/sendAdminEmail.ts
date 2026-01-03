import { User } from "../models/User";
import { sendEmail } from "./sendEmail";

export const sendAdminEmail = async (subject: string, html: string) => {
    try {
        console.log("📧 Admin email trigger started");

        // Fetch all admins & super admins
        const admins = await User.find({
            role: { $in: ["admin", "super_admin"] }
        }).select("email");

        console.log("👤 Admins found:", admins);

        if (!admins.length) {
            console.log("❌ No admins found in DB");
            return;
        }

        const emails = admins.map(a => a.email);
        console.log("📨 Sending email to:", emails);

        // Send email using Resend utility
        await sendEmail(emails, subject, html);

        console.log("✅ Admin email sent successfully via Resend");
    } catch (error) {
        console.error("❌ Admin email error:", error);
    }
};
