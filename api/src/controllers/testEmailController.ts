import { Request, Response } from 'express';
import { sendEmail } from '../utils/sendEmail';

export const sendTestEmail = async (req: Request, res: Response) => {
    try {
        const testRecipient = 'navaneethpv450@gmail.com';
        const result = await sendEmail(testRecipient, 'Resend Infra Test – Phase 1', '<p>This is a test email to verify Resend deployment.</p>');

        if (result) {
            res.status(200).json({ success: true, message: 'Test email sent successfully', data: result });
        } else {
            res.status(500).json({ success: false, message: 'Failed to send test email' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error sending test email', error });
    }
};
