import { Request, Response } from 'express';
import { analyzeImageForVisualSearch } from '../utils/visualSearchAI';
import axios from 'axios';

/**
 * STEP 2: Visual Analysis (AI – One Time)
 * Extracts category, semantic tags, and dominant color from an uploaded image.
 */
export const analyzeImage = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image uploaded' });
        }

        const result = await analyzeImageForVisualSearch(req.file.buffer, req.file.mimetype);

        // Build structured filters for Phase 3
        const responseData = {
            gender: result.gender !== 'Unisex' ? result.gender : null,
            category: result.category !== 'Unknown' ? result.category : null,
            color: result.dominantColor?.name !== 'Gray' ? result.dominantColor.name : null
        };

        res.json(responseData);
    } catch (error: any) {
        console.error('Analysis Error:', error);
        res.status(500).json({ message: error.message || 'Error analyzing image' });
    }
};

/**
 * STEP 2 (URL Variant): Visual Analysis from Image URL
 */
export const analyzeImageFromUrl = async (req: Request, res: Response) => {
    try {
        const { imageUrl } = req.body;

        if (!imageUrl) {
            return res.status(400).json({ message: 'Image URL is required' });
        }

        if (!/^https?:\/\//i.test(imageUrl)) {
            return res.status(400).json({ message: 'Invalid image URL. Must start with http:// or https://' });
        }

        let response;
        try {
            response = await axios.get(imageUrl, {
                responseType: 'arraybuffer',
                timeout: 15000,
            });
        } catch (downloadError: any) {
            console.error('Image download error:', downloadError.message);
            if (downloadError.code === 'ECONNABORTED') {
                return res.status(500).json({ message: 'Image URL request timed out. Please try a different URL.' });
            }
            return res.status(500).json({ message: 'Unable to download image from URL. Please check the URL and try again.' });
        }

        const buffer = Buffer.from(response.data);
        const mimeType = response.headers['content-type'] || 'image/jpeg';

        if (!mimeType.startsWith('image/')) {
            return res.status(400).json({ message: 'URL does not point to an image' });
        }

        const result = await analyzeImageForVisualSearch(buffer, mimeType);

        // Build structured filters for Phase 3
        const responseData = {
            gender: result.gender !== 'Unisex' ? result.gender : null,
            category: result.category !== 'Unknown' ? result.category : null,
            color: result.dominantColor?.name !== 'Gray' ? result.dominantColor.name : null
        };

        res.json(responseData);
    } catch (error: any) {
        console.error('URL Analysis Error:', error);
        res.status(500).json({ message: error.message || 'Error analyzing image from URL' });
    }
};


