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


/* ---------------- AI SUBCATEGORY (DB DRIVEN) ---------------- */
export async function getSuggestedSubCategoryFromGemini(
  imageBuffer: Buffer,
  mimeType: string,
  allowedSubCategories?: string[]
): Promise<string> {
  // Default categories if none provided
  const defaultCategories = [
    "T-Shirts", "Shirts", "Jeans", "Dresses", "Jackets", 
    "Kurtis", "Sarees", "Footwear", "Accessories"
  ];
  
  const categories = allowedSubCategories && allowedSubCategories.length > 0 
    ? allowedSubCategories 
    : defaultCategories;

  try {
    const imagePart = bufferToGenerativePart(imageBuffer, mimeType);

    const prompt = `
You are a fashion classifier AI. Analyze the clothing item in the image and determine its category.

Allowed categories:
${categories.map((c) => `- ${c}`).join("\n")}

Rules:
- Choose ONLY ONE category from the list above
- Do NOT invent new categories
- Return ONLY valid JSON in this exact format:
{"suggested_category": "CategoryName"}

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
    const suggestedCategory = parsed.suggested_category || parsed.subCategory || "";
    
    return categories.includes(suggestedCategory)
      ? suggestedCategory
      : categories[0]; // Return first category as fallback
  } catch (err) {
    console.error("Gemini Category Error:", err);
    return categories[0]; // Return first category as fallback
  }
}
