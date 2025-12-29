
import { Request, Response } from 'express';
import { Product } from '../models/Product';
import { generateAIOutfits } from '../utils/aiOutfitGenerator';

// Categories where AI outfit suggestions are NOT allowed (optional check)
const EXCLUDED_AI_CATEGORIES = [
  "Personal Care",
  "Cosmetics",
  "Beauty",
  "Makeup",
  "Skin Care",
  "Hair Care",
];

// --- SIMPLE PHASE 1: LOGIC RESET ---

const ROLE_TO_SUBCATEGORY: Record<string, string[]> = {
  top: ["Topwear", "Shirts", "T-Shirts", "Sweatshirts", "Jackets", "Blazers", "Coats", "Suits"],
  bottom: ["Bottomwear", "Jeans", "Trousers", "Shorts", "Track Pants", "Skirts"],
  footwear: ["Footwear", "Shoes", "Sneakers", "Boots", "Sandals", "Flats", "Heels"],
  accessory: ["Watches", "Accessories", "Belts", "Wallets", "Bags", "Jewellery", "Sunglasses"],
};

// Simple shuffle helper
function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Phase 1: Simple Random Matching
async function findMatchingProduct(
  suggested: any,
  baseProductId: string,
  userGender: string | null
) {
  const role = (suggested.role || "").toLowerCase();
  const allowedSubCategories = ROLE_TO_SUBCATEGORY[role] || [];

  if (allowedSubCategories.length === 0) {
    return null;
  }

  const query: any = {
    isPublished: true,
    isFashionItem: true,
    _id: { $ne: baseProductId },
    $or: [
      { subCategory: { $in: allowedSubCategories } },
      { category: { $in: allowedSubCategories } },
      { masterCategory: { $in: allowedSubCategories } }
    ]
  };

  // Basic Gender Filter
  if (userGender) {
    const genderMap: Record<string, string> = {
      male: "Men",
      female: "Women",
    };
    if (genderMap[userGender]) {
      query.gender = genderMap[userGender];
    }
  }

  // Fetch ALL matching items (Simple Pool)
  let candidates = await Product.find(query).select('name brand price_cents images variants subCategory category').lean();

  if (candidates.length === 0) {
    console.log(`[Phase 1] No items found for role: ${role}`);
    return null;
  }

  // Pure Random Selection
  const shuffled = shuffleArray(candidates);
  return shuffled[0]; // Pick first after shuffle
}

export const generateOutfit = async (req: Request, res: Response) => {
  try {
    const { productId, userPreferences } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    // 1. Fetch Base Product
    const baseProduct = await Product.findById(productId).lean();
    if (!baseProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    const gender = userPreferences?.gender || (baseProduct as any).gender === "Men" ? "male" : "female";

    // 2. Call AI to get structure (e.g. "I need a Top, Bottom, and Shoes")
    const outfitPlan = await generateAIOutfits(baseProduct, { ...userPreferences, gender });

    // 3. Simple Fill
    const filledItems = await Promise.all(
      outfitPlan.outfitItems.map(async (item: any) => {
        const product = await findMatchingProduct(item, productId, gender);
        return { ...item, product }; // Attach real product or null
      })
    );

    // Filter out items where we found no product
    const finalItems = filledItems.filter(i => i.product);

    return res.status(200).json({
      outfitTitle: outfitPlan.outfitTitle || "Stylish Look",
      overallStyleExplanation: outfitPlan.overallStyleExplanation || "A fresh combination just for you.",
      outfitItems: finalItems
    });

  } catch (error) {
    console.error("Outfit Generation Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
