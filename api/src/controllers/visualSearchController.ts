import { Request, Response } from 'express';
import { Product } from '../models/Product';
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

        res.json(result);
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

        res.json(result);
    } catch (error: any) {
        console.error('URL Analysis Error:', error);
        res.status(500).json({ message: error.message || 'Error analyzing image from URL' });
    }
};

/**
 * STEP 3: Gemini-Based Image Search (Metadata Matching)
 * 
 * Logic:
 * 1. Filter by Category (Strict).
 * 2. Match products using `$or` logic on:
 *    - dominantColor.name
 *    - aiTags.style_tags
 *    - aiTags.material_tags
 *    - aiTags.pattern
 * 3. FALLBACK: If 0 results, return latest published products.
 */
export const getSimilarProducts = async (req: Request, res: Response) => {
    try {
        const { category, aiTags, dominantColor, filters, sortBy } = req.body;

        if (!category) {
            return res.status(400).json({ message: 'Category is required' });
        }

        console.log(`[GEMINI SEARCH] Query Category: "${category}"`);
        console.log(`[GEMINI SEARCH] Query Tags:`, aiTags);
        console.log(`[GEMINI SEARCH] Query Color:`, dominantColor?.name);

        // 1. Base Query: Strict Category
        const query: any = {
            isPublished: true,
            category: category // Exact match
        };

        // 2. Build Metadata Match Scored Logic
        // We will use an aggregation pipeline to score matches manually since we want specific weighting
        // OR we can use a simpler Find with $or and client-side sorting if dataset is small.
        // Given existing architecture, let's use a Find with $or for simplicity and speed as per instructions.

        const orConditions: any[] = [];

        // Match by Color Name
        if (dominantColor?.name) {
            orConditions.push({ 'dominantColor.name': dominantColor.name });
        }

        // Match by Tags
        if (aiTags && Array.isArray(aiTags) && aiTags.length > 0) {
            orConditions.push({ 'aiTags.style_tags': { $in: aiTags } });
            orConditions.push({ 'aiTags.material_tags': { $in: aiTags } });
            orConditions.push({ 'aiTags.pattern': { $in: aiTags } });
        }

        // If we have conditions, add them to the query
        if (orConditions.length > 0) {
            // We want products that match the Category AND (Color OR Tags)
            // However, MongoDB $or inside $and can be tricky.
            // Let's use a simpler approach: Just add $or to the top level query
            query.$or = orConditions;
        }

        // Apply Extra Filters (Price, Brand)
        if (filters?.minPrice || filters?.maxPrice) {
            query.price_cents = {};
            if (filters.minPrice) query.price_cents.$gte = Number(filters.minPrice) * 100;
            if (filters.maxPrice) query.price_cents.$lte = Number(filters.maxPrice) * 100;
        }

        if (filters?.brand) {
            query.brand = filters.brand;
        }

        console.log(`[GEMINI SEARCH] MongoDB Query:`, JSON.stringify(query));

        // Execute Search
        let results = await Product.find(query)
            .limit(40)
            .lean();

        console.log(`[GEMINI SEARCH] Found ${results.length} matches.`);

        // 3. FALLBACK LOGIC
        if (results.length === 0) {
            console.warn(`[GEMINI SEARCH] 0 results found. triggering FALLBACK to latest products.`);

            // Fallback: Just get latest products from the same category first, then generic
            // Let's just do latest published products as requested "Latest published products"

            // First try latest in same category
            results = await Product.find({
                isPublished: true,
                category: category
            })
                .sort({ createdAt: -1 })
                .limit(40)
                .lean();

            if (results.length === 0) {
                // Total fallback (any category)
                results = await Product.find({ isPublished: true })
                    .sort({ createdAt: -1 })
                    .limit(40)
                    .lean();
            }
        }

        // 4. Scoring / Sorting (Client-side refinement)
        // If we have results from the specific query, let's sort them by relevance
        // (For now, simple sort or just return as is if implementation needs to be minimal)
        // Let's calculate a simple overlap score to sort best matches to top
        if (results.length > 0 && query.$or) {
            results = results.map((p: any) => {
                let score = 0;
                // Color Match
                if (dominantColor?.name && p.dominantColor?.name === dominantColor.name) {
                    score += 10;
                }
                // Tag Overlap
                const pTags = [
                    ...(p.aiTags?.style_tags || []),
                    ...(p.aiTags?.material_tags || []),
                    ...(p.aiTags?.pattern || [])
                ];
                const overlap = aiTags.filter((t: string) => pTags.includes(t)).length;
                score += overlap * 2;

                return { ...p, debugScore: score };
            }).sort((a: any, b: any) => b.debugScore - a.debugScore);
        }

        // Optional Sorts
        if (sortBy === 'price_asc') {
            results.sort((a: any, b: any) => (a.price_cents || 0) - (b.price_cents || 0));
        } else if (sortBy === 'price_desc') {
            results.sort((a: any, b: any) => (b.price_cents || 0) - (a.price_cents || 0));
        }

        res.json({
            total: results.length,
            results: results
        });

    } catch (error: any) {
        console.error('Results Error:', error);
        res.status(500).json({ message: error.message || 'Error fetching similar products' });
    }
};
