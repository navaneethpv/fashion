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
        const { productId, excludeIds = [], preset = 'casual' } = req.body; // Changed from baseProductId to productId to match frontend call

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
            { role: ROLES.FOOTWEAR, limit: 2 }
        ];

        const suggestions: any[] = [];

        // Track local exclusions for this request to prevent duplicates within the same outfit
        // Initialize with the exclusions sent from frontend
        const currentExclusionList: mongoose.Types.ObjectId[] = [...exclusionList];

        // Helper to get random products for role
        const getProductsForRole = async (targetRole: string, limit: number, useExclusions: boolean = true): Promise<any[]> => {
            let roleQuery: any = {};
            const cleanPreset = (preset || '').toLowerCase();

            switch (targetRole) {
                case ROLES.TOP:
                    if (cleanPreset === 'formal') {
                        roleQuery = {
                            $or: [{ category: 'Shirts' }, { subCategory: { $regex: /shirt|blouse|coat|blazer|jacket/i } }]
                        };
                    } else if (cleanPreset === 'sporty') {
                        roleQuery = {
                            subCategory: { $regex: /tee|tank|hoodie|sweat/i }
                        };
                    } else if (cleanPreset === 'party') {
                        roleQuery = {
                            subCategory: { $regex: /jacket|top|dress|shimmer|party/i }
                        };
                    } else if (cleanPreset === 'streetwear') {
                        roleQuery = {
                            subCategory: { $regex: /hoodie|sweat|oversize|tee|jacket/i }
                        };
                    } else if (cleanPreset === 'business') {
                        roleQuery = {
                            $or: [{ category: 'Shirts' }, { subCategory: { $regex: /shirt|polo|blouse/i } }]
                        };
                    } else { // Casual (default)
                        roleQuery = {
                            $or: [
                                { category: 'Shirts' },
                                { subCategory: { $regex: /shirt|top|tee|polo|sweater|hoodie/i } }
                            ]
                        };
                    }
                    break;
                case ROLES.BOTTOM:
                    if (cleanPreset === 'formal') {
                        roleQuery = {
                            subCategory: { $regex: /trouser|pant|skirt/i }
                        };
                    } else if (cleanPreset === 'sporty') {
                        roleQuery = {
                            subCategory: { $regex: /jogger|track|short|legging/i }
                        };
                    } else if (cleanPreset === 'party') {
                        roleQuery = {
                            subCategory: { $regex: /skirt|trouser|jean/i }
                        };
                    } else if (cleanPreset === 'streetwear') {
                        roleQuery = {
                            subCategory: { $regex: /cargo|jogger|baggy|jean|trouser/i }
                        };
                    } else if (cleanPreset === 'business') {
                        roleQuery = {
                            subCategory: { $regex: /trouser|chino|pant|skirt/i }
                        };
                    } else { // Casual
                        roleQuery = {
                            $or: [
                                { category: 'Jeans' },
                                { subCategory: { $regex: /jean|pant|short|legging|jogger/i } }
                            ]
                        };
                    }
                    break;
                case ROLES.FOOTWEAR:
                    if (cleanPreset === 'formal') {
                        roleQuery = {
                            subCategory: { $regex: /shoe|boot|heel|oxford|formal/i }
                        };
                    } else if (cleanPreset === 'sporty') {
                        roleQuery = {
                            subCategory: { $regex: /sneaker|run|sport/i }
                        };
                    } else if (cleanPreset === 'party') {
                        roleQuery = {
                            subCategory: { $regex: /heel|boot|shoe|party/i }
                        };
                    } else if (cleanPreset === 'streetwear') {
                        roleQuery = {
                            subCategory: { $regex: /sneaker|boot|high|canvas/i }
                        };
                    } else if (cleanPreset === 'business') {
                        roleQuery = {
                            subCategory: { $regex: /shoe|loafer|heel|boot/i }
                        };
                    } else { // Casual
                        roleQuery = {
                            $or: [
                                { category: 'Shoes' },
                                { subCategory: { $regex: /sneaker|sandal|flat|canvas|boot/i } }
                            ]
                        };
                    }
                    break;
            }

            const queryWithExclusion = { ...baseQuery, ...roleQuery };

            // Add exclusion if requested and list is not empty
            if (useExclusions && currentExclusionList.length > 0) {
                queryWithExclusion._id = { $nin: [...currentExclusionList, baseProduct._id] };
            }

            const products = await Product.aggregate([
                { $match: queryWithExclusion },
                { $sample: { size: limit } },
                {
                    $project: {
                        name: 1, slug: 1, price_cents: 1, brand: 1, category: 1, subCategory: 1, images: { $slice: ["$images", 1] }, variants: 1
                    }
                }
            ]);

            return products;
        };

        // fill roles
        for (const config of roleConfig) {
            if (config.role === baseRole) continue;

            // Try with exclusions first
            let products = await getProductsForRole(config.role, config.limit, true);

            // If found fewer than limit, try to fill the gap without exclusions (fallback)
            if (products.length < config.limit && exclusionList.length > 0) {
                const missingCount = config.limit - products.length;
                console.log(`[OUTFIT DEBUG] Fallback triggered for role: ${config.role}, missing: ${missingCount}`);

                // We only want to fetch *additional* items, but $sample is random. 
                // Simple strategy: fetch enough items without exclusions, filter out duplicates, and take what we need.
                // However, simpler for Phase 3: just fetch a batch without exclusions and append unique ones.
                const fallbackProducts = await getProductsForRole(config.role, config.limit + 2, false); // fetch a bit more to ensure unique

                for (const fb of fallbackProducts) {
                    if (products.length >= config.limit) break;
                    // Check if already in products or currentExclusionList (from this request)
                    const isDuplicate = products.some(p => p._id.toString() === fb._id.toString()) ||
                        currentExclusionList.some(id => id.toString() === fb._id.toString());

                    if (!isDuplicate) {
                        products.push(fb);
                    }
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
