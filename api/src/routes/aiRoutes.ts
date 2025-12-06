import { Router } from 'express';
import { upload } from '../config/multer';
import { searchByImageColor } from '../controllers/imageSearchController';

const router = Router();

// POST /api/ai/image-search
router.post('/image-search', upload.single('image'), searchByImageColor);

export default router;