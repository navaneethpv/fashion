import { Router } from 'express';
import { generateSimpleOutfit } from '../controllers/outfitController';

const router = Router();

router.post('/simple', generateSimpleOutfit);

export default router;
