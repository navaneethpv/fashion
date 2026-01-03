import express from 'express';
import { sendTestEmail } from '../controllers/testEmailController';

const router = express.Router();

router.get('/email/test', sendTestEmail);

export default router;
