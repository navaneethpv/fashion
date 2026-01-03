import { Request, Response } from 'express';
import { sendEmail } from '../utils/sendEmail';

export const sendTestEmail = async (req: Request, res: Response) => {
    try {
        const testRecipient = 'delivered@resend.dev'; // Hardcoded as per instructions (using Resend's test address)
        const result = await sendEmail(testRecipient, 'Test Email - Eyoris Fashion', '<p>This is a test email to verify Resend integration.</p>');

        if (result) {
            res.status(200).json({ success: true, message: 'Test email sent successfully', data: result });
        } else {
            res.status(500).json({ success: false, message: 'Failed to send test email' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error sending test email', error });
    }
};
