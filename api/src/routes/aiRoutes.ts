// api/src/routes/aiRoutes.ts


import { Router } from 'express';
import { upload } from '../config/multer';
import { searchByImageColor } from '../controllers/imageSearchController';

import { getSuggestedCategoryAndSubCategoryFromGemini } from '../utils/geminiTagging';
import axios from 'axios';
import { Product } from '../models/Product';

import { analyzeImage, analyzeImageFromUrl, getSimilarProducts } from '../controllers/visualSearchController';

const router = Router();

// --- VISUAL SEARCH (NEW FLOW) ---
// STEP 2: One-time analysis
router.post('/visual-search/analyze', upload.single('image'), analyzeImage);

// STEP 2 (URL Variant): Analysis from image URL
router.post('/visual-search/analyze-url', analyzeImageFromUrl);

// STEP 3 & 4: Retrieval and Refinement
router.post('/visual-search/results', getSimilarProducts);

// --- LEGACY ---
router.post('/image-search', upload.single('image'), searchByImageColor);


// Endpoint to get category and subcategory from an uploaded file
router.post('/suggest-category', upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Image file required.' });
    }

    try {
        // Get allowed categories and subcategories from MongoDB
        const categories = await Product.distinct("category", {
            isPublished: true,
            category: { $ne: "" },
        });

        const subCategories = await Product.distinct("subCategory", {
            isPublished: true,
            subCategory: { $ne: "" },
        });

        const suggestion = await getSuggestedCategoryAndSubCategoryFromGemini(
            req.file.buffer,
            req.file.mimetype,
            categories.length > 0 ? categories : undefined,
            subCategories.length > 0 ? subCategories : undefined
        );
        res.json({
            category: suggestion.category,
            subCategory: suggestion.subCategory
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'AI failed to suggest category.' });
    }
});


// Endpoint to get category and subcategory from image URL
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

        // Get allowed categories and subcategories from MongoDB
        const categories = await Product.distinct("category", {
            isPublished: true,
            category: { $ne: "" },
        });

        const subCategories = await Product.distinct("subCategory", {
            isPublished: true,
            subCategory: { $ne: "" },
        });

        const suggestion = await getSuggestedCategoryAndSubCategoryFromGemini(
            buffer,
            mimeType,
            categories.length > 0 ? categories : undefined,
            subCategories.length > 0 ? subCategories : undefined
        );

        res.json({
            category: suggestion.category,
            subCategory: suggestion.subCategory
        });
    } catch (error) {
        console.error('Image URL processing error:', error);
        res.status(500).json({ message: 'Failed to process image URL.' });
    }
});

export default router;
