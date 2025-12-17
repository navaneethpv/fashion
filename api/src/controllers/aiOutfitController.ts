// /api/src/controllers/aiOutfitController.ts

import { Request, Response } from 'express';
import { Product } from '../models/Product';
import { generateAIOutfits } from '../utils/aiOutfitGenerator';
import { generateOutfitExplanation } from '../utils/aiOutfitExplanation';

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

// 🎨 Deterministic color compatibility map (fashion color harmony rules)
// Maps base colors to compatible outfit colors
const COLOR_COMPATIBILITY: Record<string, string[]> = {
  // Navy Blue family
  "navy blue": ["white", "grey", "beige", "khaki", "light blue", "cream"],
  "navy": ["white", "grey", "beige", "khaki", "light blue", "cream"],
  "dark blue": ["white", "grey", "beige", "khaki", "light blue", "cream"],
  
  // Black family
  "black": ["white", "grey", "beige", "red", "navy blue", "cream", "pink"],
  
  // White family
  "white": ["black", "navy blue", "grey", "beige", "brown", "red", "blue", "green", "pink"],
  "cream": ["navy blue", "black", "brown", "beige", "grey"],
  "ivory": ["navy blue", "black", "brown", "beige", "grey"],
  
  // Grey family
  "grey": ["white", "black", "navy blue", "beige", "red", "pink"],
  "gray": ["white", "black", "navy blue", "beige", "red", "pink"],
  "charcoal": ["white", "beige", "navy blue", "red"],
  
  // Beige/Khaki family
  "beige": ["white", "navy blue", "brown", "black", "grey", "olive"],
  "khaki": ["white", "navy blue", "brown", "black", "grey"],
  "tan": ["white", "navy blue", "brown", "black", "grey"],
  "camel": ["white", "navy blue", "brown", "black", "grey"],
  
  // Brown family
  "brown": ["beige", "white", "navy blue", "black", "cream", "khaki"],
  "chocolate": ["beige", "white", "cream", "navy blue"],
  "cognac": ["beige", "white", "cream", "navy blue"],
  
  // Red family
  "red": ["white", "black", "navy blue", "grey", "beige"],
  "burgundy": ["white", "black", "navy blue", "grey", "beige"],
  "maroon": ["white", "black", "navy blue", "grey", "beige"],
  
  // Blue family
  "blue": ["white", "grey", "beige", "navy blue", "black"],
  "light blue": ["white", "navy blue", "grey", "beige", "black"],
  "sky blue": ["white", "navy blue", "grey", "beige"],
  
  // Green family
  "green": ["white", "beige", "navy blue", "black", "brown"],
  "olive": ["beige", "white", "brown", "navy blue"],
  "forest green": ["white", "beige", "brown", "navy blue"],
  
  // Pink family
  "pink": ["white", "black", "navy blue", "grey", "beige"],
  "rose": ["white", "black", "navy blue", "grey"],
  
  // Purple family
  "purple": ["white", "black", "grey", "beige"],
  "lavender": ["white", "grey", "beige", "navy blue"],
  
  // Yellow family
  "yellow": ["white", "navy blue", "black", "grey"],
  "mustard": ["white", "navy blue", "black", "brown"],
  
  // Orange family
  "orange": ["white", "navy blue", "black", "beige"],
  "coral": ["white", "navy blue", "black", "beige"],
};

// Normalize color name for lookup (case-insensitive, trim whitespace)
function normalizeColorName(color: string | null | undefined): string {
  if (!color) return "";
  return color.trim().toLowerCase();
}

// Get compatible colors for a given base color
function getCompatibleColors(baseColor: string | null | undefined): string[] {
  const normalized = normalizeColorName(baseColor);
  if (!normalized) return [];
  
  // Direct lookup
  if (COLOR_COMPATIBILITY[normalized]) {
    return COLOR_COMPATIBILITY[normalized];
  }
  
  // Try partial matches (e.g., "navy blue" matches "navy")
  for (const [key, values] of Object.entries(COLOR_COMPATIBILITY)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return values;
    }
  }
  
  return [];
}

// Helper to classify base subCategory as top/bottom/accessory
function classifyBaseRole(subCategory: string): "top" | "bottom" | "accessory" | "other" {
  const sub = (subCategory || "").toLowerCase();

  if (
    ["shirts", "t-shirts", "tops", "kurtis", "hoodies", "sweaters", "jackets"].some((s) =>
      sub.includes(s.toLowerCase()),
    )
  ) {
    return "top";
  }
  if (
    ["jeans", "pants", "trousers", "joggers", "skirts", "shorts"].some((s) =>
      sub.includes(s.toLowerCase()),
    )
  ) {
    return "bottom";
  }
  if (
    ["watches", "belts", "bags", "handbags", "jewelry"].some((s) =>
      sub.includes(s.toLowerCase()),
    )
  ) {
    return "accessory";
  }
  return "other";
}

// Filter outfitItems if AI misbehaves and sends unwanted roles
function filterOutfitRolesForBase(
  baseRole: "top" | "bottom" | "accessory" | "other",
  items: any[],
) {
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

// 🧠 Add gender-aware filters to MongoDB query (no gender field in DB, so we use heuristics)
function applyGenderFilterToQuery(query: any, userGender?: string | null) {
  if (!userGender) return query;

  const malePattern = /(men|man's|men's|boy|boys|gents)/i;
  const femalePattern = /(women|woman|girls|girl|ladies|lady|female)/i;

  query.$and = query.$and || [];

  if (userGender === "female") {
    // Avoid clearly male-only items
    query.$and.push({
      $nor: [{ name: malePattern }, { description: malePattern }],
    });
  } else if (userGender === "male") {
    // Avoid clearly women-only items
    query.$and.push({
      $nor: [{ name: femalePattern }, { description: femalePattern }],
    });
  }

  // Neutral products (no gender words) are allowed.
  return query;
}

// 🔁 Helper: pick a random element from an array
function pickRandom<T>(arr: T[]): T | null {
  if (!arr.length) return null;
  const index = Math.floor(Math.random() * arr.length);
  return arr[index];
}

// Find a matching product for a given AI suggestion, respecting user gender,
// color compatibility, and avoiding duplicates within the same outfit.
async function findMatchingProduct(
  suggested: any,
  baseProductId: string,
  userGender: string | null,
  usedProductIds: Set<string>,
  baseProductColor: string | null | undefined,
) {
  const role = (suggested.role || "").toLowerCase();
  const colorSuggestion = suggested.colorSuggestion as string | undefined;

  const allowedSubCategories = ROLE_TO_SUBCATEGORY[role] || [];
  if (allowedSubCategories.length === 0) return null;

  let query: any = {
    isPublished: true,
    _id: { $ne: baseProductId },
    subCategory: { $in: allowedSubCategories },
  };

  if (colorSuggestion) {
    query['variants.color'] = new RegExp(colorSuggestion, 'i');
  }

  // Apply gender filter based on userPreferences.gender
  query = applyGenderFilterToQuery(query, userGender);

  // 1) Try with color + gender + subCategory
  let candidates = await Product.find(query).lean();

  // Remove already used product IDs (avoid same dress/shoe within same outfit)
  candidates = candidates.filter((p: any) => !usedProductIds.has(String(p._id)));

  // 2) Apply deterministic color compatibility filtering if base color exists
  if (baseProductColor && candidates.length > 0) {
    const compatibleColors = getCompatibleColors(baseProductColor);
    if (compatibleColors.length > 0) {
      const colorFiltered = candidates.filter((p: any) => {
        const candidateColor = normalizeColorName(
          p.dominantColor?.name || p.aiTags?.dominant_color_name
        );
        if (!candidateColor) return false;
        
        // Check if candidate color matches any compatible color
        return compatibleColors.some((compatColor) => {
          const normalizedCompat = normalizeColorName(compatColor);
          return candidateColor.includes(normalizedCompat) || 
                 normalizedCompat.includes(candidateColor) ||
                 candidateColor === normalizedCompat;
        });
      });
      
      // Only use color-filtered results if we have matches
      if (colorFiltered.length > 0) {
        candidates = colorFiltered;
      }
      // If no color matches, fallback to original candidates (graceful degradation)
    }
  }

  // 3) If still none, drop color filter and retry (original fallback behavior)
  if (!candidates.length) {
    delete query['variants.color'];
    candidates = await Product.find(query).lean();
    candidates = candidates.filter((p: any) => !usedProductIds.has(String(p._id)));
    
    // Re-apply color compatibility if base color exists (second attempt)
    if (baseProductColor && candidates.length > 0) {
      const compatibleColors = getCompatibleColors(baseProductColor);
      if (compatibleColors.length > 0) {
        const colorFiltered = candidates.filter((p: any) => {
          const candidateColor = normalizeColorName(
            p.dominantColor?.name || p.aiTags?.dominant_color_name
          );
          if (!candidateColor) return false;
          
          return compatibleColors.some((compatColor) => {
            const normalizedCompat = normalizeColorName(compatColor);
            return candidateColor.includes(normalizedCompat) || 
                   normalizedCompat.includes(candidateColor) ||
                   candidateColor === normalizedCompat;
          });
        });
        
        if (colorFiltered.length > 0) {
          candidates = colorFiltered;
        }
      }
    }
  }

  const picked = pickRandom(candidates);
  return picked || null;
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

    // 2) Validate fashion item (allow all fashion items, not just a restricted list)
    if (baseProduct.isFashionItem !== true) {
      return res.status(400).json({
        message: "AI outfit suggestions are only available for fashion items.",
      });
    }

    const baseSub = baseProduct.subCategory || baseProduct.category || "";
    if (!baseSub) {
      return res.status(400).json({
        message: "Base product must have a category or subCategory.",
      });
    }

    const baseRole = classifyBaseRole(baseSub);
    const userGender: string | null =
      userPreferences?.gender === "male" || userPreferences?.gender === "female"
        ? userPreferences.gender
        : null;

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

    // 6) Attach real products from DB (gender-aware, color-compatible, non-repeating)
    const matchedItems: any[] = [];
    const usedProductIds = new Set<string>();
    
    // Extract base product color for deterministic color matching
    const baseProductColor = (baseProduct as any).dominantColor?.name || 
                             (baseProduct as any).aiTags?.dominant_color_name || 
                             null;

    for (const item of outfitItems) {
      const product = await findMatchingProduct(
        item,
        baseProduct._id.toString(),
        userGender,
        usedProductIds,
        baseProductColor,
      );

      if (product) {
        usedProductIds.add(String(product._id));
      }

      matchedItems.push({
        ...item,
        product,
      });
    }

    // 7) Optional AI explanation layer (does NOT affect outfit selection logic)
    let explanationResult: {
      explanation: string;
      styleTips: string[];
      occasion: string;
    } | null = null;

    try {
      const baseProductForExplanation = {
        name: baseProduct.name,
        category: baseProduct.subCategory || baseProduct.category,
        color:
          (baseProduct.variants && baseProduct.variants[0]?.color) ||
          baseProduct.dominantColor?.name ||
          "",
        gender: (baseProduct as any).gender || "",
      };

      const outfitItemsForExplanation = matchedItems
        .filter((item) => item.product)
        .map((item) => {
          const product = item.product as any;
          return {
            name: product.name,
            category: product.subCategory || product.category,
            color:
              (product.variants && product.variants[0]?.color) ||
              product.dominantColor?.name ||
              "",
          };
        });

      if (outfitItemsForExplanation.length > 0) {
        explanationResult = await generateOutfitExplanation(
          baseProductForExplanation,
          outfitItemsForExplanation,
        );
      }
    } catch (explanationError) {
      // If the explanation layer fails, we still return the normal outfit response.
      console.error("AI Outfit Explanation Error:", explanationError);
      explanationResult = null;
    }

    // 8) Final response (backward compatible; AI fields are optional)
    const responseBody: any = {
      base: baseProduct,
      outfitTitle: aiResult.outfitTitle,
      outfitItems: matchedItems,
      overallStyleExplanation: aiResult.overallStyleExplanation,
    };

    if (explanationResult) {
      responseBody.aiExplanation = explanationResult.explanation;
      responseBody.styleTips = explanationResult.styleTips;
      responseBody.occasion = explanationResult.occasion;
    }

    return res.json(responseBody);
  } catch (error) {
    console.error("AI Outfit Error:", error);
    return res.status(500).json({ message: "Failed to generate AI outfit." });
  }
};
