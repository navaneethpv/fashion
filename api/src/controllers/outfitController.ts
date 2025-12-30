import { Request, Response } from 'express';
import { Product, IProduct } from '../models/Product';
import mongoose from 'mongoose';

// Minimal constants for Phase 1
const ROLES = {
    TOP: 'Top',
    BOTTOM: 'Bottom',
    FOOTWEAR: 'Footwear',
    ACCESSORY: 'Accessory',
    OTHER: 'Other'
};

const MOOD_KEYWORDS: Record<string, string[]> = {
    casual: ["tshirt", "tee", "polo", "hoodie", "sweater", "casual", "shirt"],
    formal: ["shirt", "blazer", "suit", "formal", "trouser", "coat"],
    party: ["printed", "party", "shimmer", "jacket", "dress", "fashion"],

    streetwear: ["oversized", "hoodie", "street", "cargo", "baggy", "jacket", "printed"],
    business: ["blazer", "formal", "office", "chino", "shirt", "trouser", "polo"]
};

// Helper: Classify product into a role
const getProductRole = (product: IProduct): string => {
    const cat = (product.category || '').toLowerCase();
    const sub = (product.subCategory || '').toLowerCase();
    const name = (product.name || '').toLowerCase();

    // Footwear
    if (cat === 'shoes' || sub.includes('shoe') || sub.includes('sneaker') || sub.includes('boots') || sub.includes('sandal') || sub.includes('heels') || sub.includes('flats')) {
        return ROLES.FOOTWEAR;
    }

    // Tops
    if (cat === 'shirts' || sub.includes('shirt') || sub.includes('top') || sub.includes('tee') || sub.includes('polo') || sub.includes('blouse') || sub.includes('jacket') || sub.includes('coat') || sub.includes('sweater') || sub.includes('hoodie') || sub.includes('sweatshirt')) {
        return ROLES.TOP;
    }

    // Bottoms
    if (cat === 'jeans' || sub.includes('jean') || sub.includes('pant') || sub.includes('trouser') || sub.includes('legging') || sub.includes('jogger') || sub.includes('short') || sub.includes('skirt')) {
        return ROLES.BOTTOM;
    }

    // Accessories
    if (cat === 'watch' || cat === 'belt' || sub.includes('watch') || sub.includes('belt') || sub.includes('bag') || sub.includes('wallet') || sub.includes('hat') || sub.includes('cap') || sub.includes('accessory')) {
        return ROLES.ACCESSORY;
    }

    return ROLES.OTHER;
};

// POST /api/outfit/simple
export const generateSimpleOutfit = async (req: Request, res: Response) => {
    try {
        const { productId, excludeIds = [], mood = 'casual' } = req.body;

        if (!productId) {
            return res.status(400).json({ message: 'Product ID is required.' });
        }

        const baseProduct = await Product.findById(productId);
        if (!baseProduct) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        const baseRole = getProductRole(baseProduct);
        const gender = baseProduct.gender;

        // Base query for compatibility
        const baseQuery: any = {
            _id: { $ne: baseProduct._id },
            isPublished: true,
            stock: { $gt: 0 },
        };

        // Use excludeIds if provided (safely cast to ObjectId or ignore invalid ones)
        // We assume excludeIds is an array of strings.
        const exclusionList: any[] = [];
        if (Array.isArray(excludeIds) && excludeIds.length > 0) {
            console.log("[OUTFIT DEBUG] Received Exclude IDs:", excludeIds.length);
            excludeIds.forEach((id: string) => {
                if (mongoose.Types.ObjectId.isValid(id)) {
                    exclusionList.push(new mongoose.Types.ObjectId(id));
                }
            });
            console.log("[OUTFIT DEBUG] Valid ObjectIds for Exclusion:", exclusionList.length);
        }

        // Strict gender matching if available
        if (gender) {
            baseQuery.gender = gender;
        }

        // Define roles and limits
        const roleConfig = [
            { role: ROLES.TOP, limit: 3 },
            { role: ROLES.BOTTOM, limit: 3 },
            { role: ROLES.FOOTWEAR, limit: 2 },
            { role: ROLES.ACCESSORY, limit: 2 }
        ];

        const suggestions: any[] = [];

        // Track local exclusions for this request to prevent duplicates within the same outfit
        // Initialize with the exclusions sent from frontend
        const currentExclusionList: mongoose.Types.ObjectId[] = [...exclusionList];

        // Helper to get random products for role
        const getProductsForRole = async (targetRole: string, limit: number, enforceMood: boolean, useExclusions: boolean = true): Promise<any[]> => {
            let roleQuery: any = {};

            // 1. Generic Role Definitions (Broad)
            switch (targetRole) {
                case ROLES.TOP:
                    roleQuery = { $or: [{ category: 'Shirts' }, { subCategory: { $regex: /shirt|top|tee|polo|blouse|jacket|coat|sweater|hoodie/i } }] };
                    break;
                case ROLES.BOTTOM:
                    roleQuery = { $or: [{ category: 'Jeans' }, { subCategory: { $regex: /jean|pant|trouser|legging|jogger|short|skirt/i } }] };
                    break;
                case ROLES.FOOTWEAR:
                    roleQuery = { $or: [{ category: 'Shoes' }, { subCategory: { $regex: /shoe|sneaker|boot|sandal|heel|flat/i } }] };
                    break;
                case ROLES.ACCESSORY:
                    const g = (gender || '').toLowerCase();
                    if (g === 'men') {
                        roleQuery = { subCategory: { $regex: /watch|belt|wallet|cap|sunglass/i } };
                    } else if (g === 'women') {
                        roleQuery = { subCategory: { $regex: /earring|bracelet|necklace|handbag|clutch|watch|sunglass/i } };
                    } else if (g === 'kids') {
                        roleQuery = { subCategory: { $regex: /cap|watch|bag|backpack/i } };
                    } else {
                        roleQuery = { subCategory: { $regex: /accessory|watch|bag/i } };
                    }
                    break;
            }

            // 2. Apply Mood Filter (Only for Top/Bottom)
            const cleanMood = (mood || '').toLowerCase();
            const keywords = MOOD_KEYWORDS[cleanMood];

            if (enforceMood && keywords && (targetRole === ROLES.TOP || targetRole === ROLES.BOTTOM)) {
                const moodRegex = new RegExp(keywords.join('|'), 'i');
                // Intersect strict role definition with mood keywords on Name OR SubCategory OR Description
                roleQuery = {
                    $and: [
                        roleQuery,
                        { $or: [{ name: { $regex: moodRegex } }, { subCategory: { $regex: moodRegex } }, { description: { $regex: moodRegex } }] }
                    ]
                };
            }

            // 3. Exclusions
            const queryWithExclusion = { ...baseQuery, ...roleQuery };
            if (useExclusions && currentExclusionList.length > 0) {
                queryWithExclusion._id = { $nin: [...currentExclusionList, baseProduct._id] };
            }

            return await Product.aggregate([
                { $match: queryWithExclusion },
                { $sample: { size: limit } },
                {
                    $project: {
                        name: 1, slug: 1, price_cents: 1, brand: 1, category: 1, subCategory: 1, images: { $slice: ["$images", 1] }, variants: 1
                    }
                }
            ]);
        };

        // fill roles
        for (const config of roleConfig) {
            if (config.role === baseRole) continue;

            // Step A: Try with Exclusion AND Mood
            let products = await getProductsForRole(config.role, config.limit, true, true);

            // Step B: If empty? Try with Exclusion but NO Mood (Mood fallback)
            if (products.length === 0) {
                console.log(`[OUTFIT DEBUG] Mood fallback triggered for ${config.role} (${mood})`);
                products = await getProductsForRole(config.role, config.limit, false, true);
            }

            // Step C: If still not enough items? Try ignoring exclusions (Repetition fallback)
            if (products.length < config.limit && exclusionList.length > 0) {
                const fallback = await getProductsForRole(config.role, config.limit + 2, false, false); // Fetch generic, No Exclusions
                for (const fb of fallback) {
                    if (products.length >= config.limit) break;
                    // Avoid duplicates
                    const exists = products.some(p => p._id.toString() === fb._id.toString()) ||
                        currentExclusionList.some(id => id.toString() === fb._id.toString());
                    if (!exists) products.push(fb);
                }
            }

            // Add found products to suggestions and update local exclusion list
            for (const product of products) {
                suggestions.push({
                    role: config.role,
                    suggestedType: product.subCategory || product.category,
                    colorSuggestion: 'Matching',
                    colorHexSuggestion: '#000000',
                    reason: `Matches your ${baseRole}`,
                    product: product
                });

                // Add to local exclusion so next roles/iterations don't pick it (unlikely but safe)
                currentExclusionList.push(product._id);
            }
        }

        res.json({
            outfitTitle: "Style Studio Collection",
            overallStyleExplanation: "A curated collection of options based on your item.",
            outfitItems: suggestions
        });

    } catch (error) {
        console.error("Simple Outfit Error:", error);
        res.status(500).json({ message: "Failed to generate outfit." });
    }
};
