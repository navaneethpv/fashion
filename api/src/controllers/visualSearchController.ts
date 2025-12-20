import { Request, Response } from 'express';
import { Product } from '../models/Product';
import { analyzeImageForVisualSearch } from '../utils/visualSearchAI';
import { calculateColorDistance, distanceToSimilarity } from '../utils/colorMath';
import { normalizeCategoryName } from '../utils/categoryNormalizer';

/**
 * STEP 2: Visual Analysis (AI – One Time)
 * Extracts category, semantic tags, and dominant color from an uploaded image.
 * 
 * Explainability: AI is used only for metadata extraction to ensure 
 * predictable and explainable search results.
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
 * STEP 3 & 4: Similar Product Retrieval & Refinement
 * 
 * Logic:
 * 1. Fetch products matching the same category and overlapping semantic tags.
 * 2. STRUCTURAL SIMILARITY FIRST: Color is NOT used for initial filtering to show 
 *    diverse options that are structurally similar.
 * 3. SECONDARY REFINEMENT: Optional color filtering and Euclidean distance sorting.
 * 
 * Explainability: This decoupled approach allows users to understand WHY a product 
 * was suggested (category + style) while giving them control over visual filters.
 */
export const getSimilarProducts = async (req: Request, res: Response) => {
    try {
        const { category, aiTags, filters, sortBy } = req.body;

        if (!category) {
            return res.status(400).json({ message: 'Category is required' });
        }

        // Normalize AI-detected category to match database categories
        const normalizedCategory = normalizeCategoryName(category);
        console.log(`[VISUAL SEARCH] AI Category: "${category}" -> Normalized: "${normalizedCategory}"`);

        // Structural attributes are used only for ranking, not filtering
        const query: any = {
            isPublished: { $ne: false },
            category: { $regex: new RegExp(`^${normalizedCategory}$`, 'i') }
        };

        // Color and other filters are optional user refinements
        if (filters?.colors && filters.colors.length > 0) {
            query['dominantColor.name'] = { $in: filters.colors };
        }

        // Additional optional filters
        if (filters?.minPrice || filters?.maxPrice) {
            query.price = {};
            if (filters.minPrice) query.price.$gte = filters.minPrice;
            if (filters.maxPrice) query.price.$lte = filters.maxPrice;
        }

        if (filters?.brand) {
            query.brand = filters.brand;
        }

        const candidates = await Product.find(query).limit(200).lean();

        console.log(`[VISUAL SEARCH] Query:`, JSON.stringify(query));
        console.log(`[VISUAL SEARCH] Found ${candidates.length} candidates`);
        if (candidates.length > 0) {
            console.log(`[VISUAL SEARCH] Sample product:`, {
                name: candidates[0].name,
                category: candidates[0].category
            });
        }

        // Calculate similarity based on tags and optionally color
        let results = candidates.map((product: any) => {
            // Base similarity from category match (already queried)
            let similarityScore = 0.5; // Start with 50% for category match

            // Boost similarity for tag overlaps
            const productTags = [...(product.aiTags?.style_tags || []), ...(product.aiTags?.material_tags || [])];
            const overlap = aiTags?.filter((tag: string) => productTags.includes(tag)) || [];
            if (aiTags && aiTags.length > 0) {
                similarityScore += (overlap.length / aiTags.length) * 0.3; // Up to 30% boost for tags
            }

            // 🧮 Color Similarity Logic (Activated if sorting by color or for display)
            let colorSimilarity = 0;
            if (product.dominantColor?.rgb && req.body.dominantColor?.rgb) {
                const queryRgb = {
                    r: req.body.dominantColor.rgb[0],
                    g: req.body.dominantColor.rgb[1],
                    b: req.body.dominantColor.rgb[2]
                };
                const productRgb = {
                    r: product.dominantColor.rgb[0],
                    g: product.dominantColor.rgb[1],
                    b: product.dominantColor.rgb[2]
                };

                const distance = calculateColorDistance(queryRgb, productRgb);
                colorSimilarity = distanceToSimilarity(distance);
            }

            // If user specifically asked for color-based similarity search (optional refinement)
            // we can integrate it into the final score
            const finalSimilarity = (similarityScore + colorSimilarity * 0.2) * 100;

            return {
                ...product,
                similarity: Math.round(finalSimilarity),
                colorSimilarity: Math.round(colorSimilarity * 100)
            };
        });

        // SORTING
        if (sortBy === 'color') {
            results.sort((a, b) => b.colorSimilarity - a.colorSimilarity);
        } else if (sortBy === 'price_asc') {
            results.sort((a, b) => a.price - b.price);
        } else if (sortBy === 'price_desc') {
            results.sort((a, b) => b.price - a.price);
        } else {
            // Default: Overall similarity
            results.sort((a, b) => b.similarity - a.similarity);
        }

        res.json({
            total: results.length,
            results: results.slice(0, 50) // Limit results for performance
        });
    } catch (error: any) {
        console.error('Results Error:', error);
        res.status(500).json({ message: error.message || 'Error fetching similar products' });
    }
};
