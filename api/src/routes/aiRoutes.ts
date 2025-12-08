import { Router } from 'express';
import { upload } from '../config/multer';
import { searchByImageColor } from '../controllers/imageSearchController';
import { getOutfitRecommendations } from '../controllers/recommendationController'; // 👈 NEW IMPORT

const router = Router();

router.post('/image-search', upload.single('image'), searchByImageColor);
router.get('/recommendations', getOutfitRecommendations); // 👈 NEW ROUTE

export default router;