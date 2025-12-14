import { GoogleGenAI } from "@google/genai";
import { Buffer } from "buffer";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

/* ---------------- IMAGE PART HELPER ---------------- */
function bufferToGenerativePart(buffer: Buffer, mimeType: string) {
  return {
    inlineData: {
      data: buffer.toString("base64"),
      mimeType,
    },
  };
}

/* ---------------- TAG SCHEMA ---------------- */
const TAG_SCHEMA = {
  type: "object",
  properties: {
    dominant_color_name: { type: "string" },
    style_tags: { type: "array", items: { type: "string" } },
    material_tags: { type: "array", items: { type: "string" } },
  },
  required: ["dominant_color_name", "style_tags"],
};

/* ---------------- CATEGORY SCHEMA ---------------- */
const CATEGORY_SCHEMA = {
  type: "object",
  properties: {
    subCategory: {
      type: "string",
      description: "Must be exactly one value from allowedSubCategories",
    },
  },
  required: ["subCategory"],
};

/* ---------------- PRODUCT TAGGING ---------------- */
export async function getProductTagsFromGemini(
  imageBuffer: Buffer,
  mimeType: string
) {
  try {
    const imagePart = bufferToGenerativePart(imageBuffer, mimeType);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [imagePart, { text: "Analyze clothing item and generate tags." }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: TAG_SCHEMA,
        temperature: 0.1,
      },
    });

    return JSON.parse(response.text!);
  } catch (err) {
    console.error("Gemini Tag Error:", err);
    return {
      dominant_color_name: "unknown",
      style_tags: [],
      material_tags: [],
    };
  }
}



/* ---------------- AI CATEGORY AND SUBCATEGORY (DB DRIVEN) ---------------- */
interface CategorySuggestion {
  category: string;
  subCategory: string;
}

export async function getSuggestedCategoryAndSubCategoryFromGemini(
  imageBuffer: Buffer,
  mimeType: string,
  allowedCategories?: string[],
  allowedSubCategories?: string[]
): Promise<CategorySuggestion> {
  // Default categories if none provided
  const defaultCategories = [
    "T-Shirts", "Shirts", "Jeans", "Dresses", "Jackets", 
    "Kurtis", "Sarees", "Footwear", "Accessories"
  ];
  
  const defaultSubCategories = [
    // T-Shirts
    "Round Neck", "V Neck", "Polo", "Graphic", "Plain",
    // Shirts  
    "Formal Shirt", "Casual Shirt", "Denim Shirt", "Flannel",
    // Jeans
    "Slim Fit", "Regular Fit", "Bootcut", "Skinny", "Straight",
    // Dresses
    "A-Line", "Bodycon", "Maxi", "Mini", "Midi",
    // Jackets
    "Denim Jacket", "Bomber Jacket", "Leather Jacket", "Blazer", "Windbreaker",
    // Kurtis
    "Anarkali", "Straight", "A-Line", "Floor Length", "Short",
    // Sarees
    "Silk Saree", "Cotton Saree", "Georgette", "Chiffon", "Banarasi",
    // Footwear
    "Sneakers", "Heels", "Flats", "Boots", "Sandals",
    // Accessories
    "Bags", "Jewelry", "Watches", "Belts", "Sunglasses"
  ];
  
  const categories = allowedCategories && allowedCategories.length > 0 
    ? allowedCategories 
    : defaultCategories;
    
  const subCategories = allowedSubCategories && allowedSubCategories.length > 0 
    ? allowedSubCategories 
    : defaultSubCategories;

  try {
    const imagePart = bufferToGenerativePart(imageBuffer, mimeType);

    const prompt = `
You are a fashion classifier AI. Analyze the clothing item in the image and determine its category and subcategory.

Main Categories:
${categories.map((c) => `- ${c}`).join("\n")}

Subcategories (for reference):
${subCategories.map((sc) => `- ${sc}`).join("\n")}

Rules:
- Choose ONLY ONE main category from the list above
- Choose ONLY ONE subcategory that belongs to the selected main category
- Do NOT invent new categories or subcategories
- Return ONLY valid JSON in this exact format:
{"category": "MainCategoryName", "subCategory": "SubCategoryName"}

Output valid JSON only, no explanations.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [imagePart, { text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    });

    const parsed = JSON.parse(response.text!);
    const suggestedCategory = parsed.category || "";
    const suggestedSubCategory = parsed.subCategory || "";
    
    return {
      category: categories.includes(suggestedCategory) ? suggestedCategory : categories[0],
      subCategory: subCategories.includes(suggestedSubCategory) ? suggestedSubCategory : subCategories[0]
    };
  } catch (err) {
    console.error("Gemini Category Error:", err);
    return {
      category: categories[0],
      subCategory: subCategories[0]
    };
  }
}
