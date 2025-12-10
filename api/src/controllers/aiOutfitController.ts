// /api/src/controllers/aiOutfitController.ts

import { Request, Response } from 'express';
import { Product } from '../models/Product';
import { generateAIOutfits } from '../utils/aiOutfitGenerator';

// Categories where AI outfit suggestions are NOT allowed at all
const EXCLUDED_AI_CATEGORIES = [
  "Personal Care",
  "Cosmetics",
  "Beauty",
  "Makeup",
  "Skin Care",
  "Hair Care",
];

// Subcategories where AI outfit IS allowed (Shirts, Pants, Accessories etc.)
const ALLOWED_AI_SUBCATEGORIES = [
  // Tops
  "Shirts",
  "T-Shirts",
  "Tops",
  "Kurtis",
  "Hoodies",
  "Sweaters",
  "Jackets",

  // Bottoms
  "Jeans",
  "Pants",
  "Trousers",
  "Joggers",
  "Skirts",
  "Shorts",

  // Accessories
  "Watches",
  "Belts",
  "Bags",
  "Handbags",
  "Jewelry",
];

// Map AI roles to DB subCategory groups
const ROLE_TO_SUBCATEGORY: Record<string, string[]> = {
  top: ["Shirts", "T-Shirts", "Tops", "Kurtis", "Hoodies", "Sweaters", "Jackets"],
  bottom: ["Jeans", "Pants", "Trousers", "Joggers", "Skirts", "Shorts"],
  shoes: ["Shoes", "Sneakers", "Heels", "Sandals", "Boots"],
  accessories: ["Watches", "Belts", "Bags", "Handbags", "Jewelry"],
};

// Helper to classify base subCategory as top/bottom/accessory
function classifyBaseRole(subCategory: string): "top" | "bottom" | "accessory" | "other" {
  const sub = (subCategory || "").toLowerCase();

  if (["shirts", "t-shirts", "tops", "kurtis", "hoodies", "sweaters", "jackets"].some(s => sub.includes(s.toLowerCase()))) {
    return "top";
  }
  if (["jeans", "pants", "trousers", "joggers", "skirts", "shorts"].some(s => sub.includes(s.toLowerCase()))) {
    return "bottom";
  }
  if (["watches", "belts", "bags", "handbags", "jewelry"].some(s => sub.includes(s.toLowerCase()))) {
    return "accessory";
  }
  return "other";
}

// Filter outfitItems if AI misbehaves and sends unwanted roles
function filterOutfitRolesForBase(baseRole: "top" | "bottom" | "accessory" | "other", items: any[]) {
  if (baseRole === "top") {
    // base is shirt/top → only show bottom, shoes, accessories
    return items.filter((i) => !["top"].includes((i.role || "").toLowerCase()));
  }
  if (baseRole === "bottom") {
    // base is pant/jeans → only top, shoes, accessories
    return items.filter((i) => !["bottom"].includes((i.role || "").toLowerCase()));
  }
  if (baseRole === "accessory") {
    // base is accessory → only top, bottom, shoes
    return items.filter((i) => !["accessories"].includes((i.role || "").toLowerCase()));
  }
  return items; // other = no extra restriction
}

// Find a matching product for a given AI suggestion
async function findMatchingProduct(suggested: any, baseProductId: string) {
  const role = (suggested.role || "").toLowerCase();
  const colorSuggestion = suggested.colorSuggestion as string | undefined;

  const allowedSubCategories = ROLE_TO_SUBCATEGORY[role] || [];
  if (allowedSubCategories.length === 0) return null;

  const query: any = {
    isPublished: true,
    _id: { $ne: baseProductId },
    subCategory: { $in: allowedSubCategories },
  };

  if (colorSuggestion) {
    query["variants.color"] = new RegExp(colorSuggestion, "i");
  }

  // Try color + category first
  let product = await Product.findOne(query).lean();

  // Fallback: ignore color if none found
  if (!product) {
    delete query["variants.color"];
    product = await Product.findOne(query).lean();
  }

  return product;
}

// MAIN CONTROLLER: POST /api/ai/outfit
export const generateOutfit = async (req: Request, res: Response) => {
  try {
    const { productId, userPreferences } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "productId required" });
    }

    const baseProduct = await Product.findById(productId).lean();
    if (!baseProduct) {
      return res.status(404).json({ message: "Base product not found." });
    }

    // 1) BLOCK cosmetics / personal care by category
    if (EXCLUDED_AI_CATEGORIES.includes(baseProduct.category)) {
      return res.status(400).json({
        message: "AI outfit suggestions are not available for cosmetic or personal care products.",
      });
    }

    // 2) Only allow AI for Shirts / Pants / Accessories (by subCategory)
    const baseSub = baseProduct.subCategory || "";
    if (!ALLOWED_AI_SUBCATEGORIES.includes(baseSub)) {
      return res.status(400).json({
        message:
          "AI outfit suggestions are currently available only for shirts, pants/bottoms, and accessories.",
      });
    }

    const baseRole = classifyBaseRole(baseSub);

    // 3) Prepare input for AI
    const inputData = {
      baseItem: {
        id: baseProduct._id.toString(),
        category: baseSub, // use subCategory so rules understand it's shirt/pant/accessory
        color: baseProduct.variants?.[0]?.color,
        colorHex: baseProduct.dominantColor?.hex,
      },
      userPreferences: userPreferences || {},
    };

    // 4) Call Gemini
    const aiResult = await generateAIOutfits(inputData);

    // 5) Safeguard: filter roles locally as well
    let outfitItems = Array.isArray(aiResult.outfitItems) ? aiResult.outfitItems : [];
    outfitItems = filterOutfitRolesForBase(baseRole, outfitItems);

    // 6) Attach real products from DB
    const matchedItems: any[] = [];
    for (const item of outfitItems) {
      const product = await findMatchingProduct(item, baseProduct._id.toString());
      matchedItems.push({
        ...item,
        product,
      });
    }

    // 7) Final response
    return res.json({
      base: baseProduct,
      outfitTitle: aiResult.outfitTitle,
      outfitItems: matchedItems,
      overallStyleExplanation: aiResult.overallStyleExplanation,
    });
  } catch (error) {
    console.error("AI Outfit Error:", error);
    return res.status(500).json({ message: "Failed to generate AI outfit." });
  }
};
