// api/src/routes/aiRoutes.ts


import { Router } from 'express';
import { upload } from '../config/multer';
import { searchByImageColor } from '../controllers/imageSearchController';
import { getOutfitRecommendations } from '../controllers/recommendationController';
import { getSuggestedSubCategoryFromGemini } from '../utils/geminiTagging';
import { generateOutfit } from '../controllers/aiOutfitController';
import axios from 'axios';
import { Product } from '../models/Product';

const router = Router();

router.post('/image-search', upload.single('image'), searchByImageColor);
router.get('/recommendations', getOutfitRecommendations);

// Endpoint to get category from an uploaded file
router.post('/suggest-category', upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Image file required.' });
    }
    
    try {
        // Get allowed categories from MongoDB
        const subCategories = await Product.distinct("subCategory", {
            isPublished: true,
            subCategory: { $ne: "" },
        });
        
        const category = await getSuggestedSubCategoryFromGemini(
            req.file.buffer, 
            req.file.mimetype,
            subCategories.length > 0 ? subCategories : undefined
        );
        res.json({ suggested_category: category });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'AI failed to suggest category.' });
    }
});

// Endpoint to get category from image URL
router.post('/suggest-category-url', async (req, res) => {
    try {
        const { imageUrl } = req.body;
        
        if (!imageUrl) {
            return res.status(400).json({ message: 'Image URL is required.' });
        }

        // Download the image
        const response = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            timeout: 15000,
        });

        const buffer = Buffer.from(response.data);
        const mimeType = response.headers['content-type'] || 'image/jpeg';

        // Get allowed categories from MongoDB
        const subCategories = await Product.distinct("subCategory", {
            isPublished: true,
            subCategory: { $ne: "" },
        });

        const category = await getSuggestedSubCategoryFromGemini(
            buffer,
            mimeType,
            subCategories.length > 0 ? subCategories : undefined
        );
        
        res.json({ suggested_category: category });
    } catch (error) {
        console.error('Image URL processing error:', error);
        res.status(500).json({ message: 'Failed to process image URL.' });
    }
});

router.post('/outfit', generateOutfit);

export default router;
