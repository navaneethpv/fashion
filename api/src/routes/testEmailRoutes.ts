import express from 'express';
import { sendTestEmail } from '../controllers/testEmailController';

const router = express.Router();

router.get('/test-email', sendTestEmail);

export default router;
