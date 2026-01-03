import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async (to: string | string[], subject: string, html: string) => {
    try {
        const { data, error } = await resend.emails.send({
            from: 'Eyoris Fashion <onboarding@resend.dev>',
            to,
            subject,
            html,
        });

        if (error) {
            console.error("Error sending email:", error);
            return null;
        }

        console.log("Email sent successfully:", data);
        return data;
    } catch (err) {
        console.error("Unexpected error sending email:", err);
        return null;
    }
};
