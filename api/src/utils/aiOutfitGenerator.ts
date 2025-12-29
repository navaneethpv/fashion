// /api/src/utils/aiOutfitGenerator.ts

import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

// @ts-ignore
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * We don't train Gemini ourselves.
 * We "train" it using strict fashion rules + JSON schema.
 * This prompt also controls which ROLES (top/bottom/shoes/accessories) are allowed
 * based on the kind of base item (shirt, pant, accessory).
 */
const OUTFIT_GENERATION_RULES = `
You are an AI fashion stylist for an e-commerce website.

You will receive:
- baseItem: { id, category, color, colorHex }
- userPreferences: { gender, styleVibe, avoidColors[], ... }

Your job:
- Suggest a small outfit around the base item
- Use only ROLES allowed based on baseItem.category (which is the product's subCategory)
- Return ONLY valid JSON that fits the provided JSON schema.

--- ROLE RULES (VERY IMPORTANT) ---

Treat baseItem.category as the clothing subCategory. Follow these rules:

1) If baseItem.category is a TOP:
   - TOP examples: "Shirts", "T-Shirts", "Tops", "Kurtis", "Hoodies", "Sweaters", "Jackets"
   - Then suggest ONLY roles: "bottom", "shoes", "accessories"
   - NEVER include another "top" in outfitItems.

2) If baseItem.category is a BOTTOM:
   - BOTTOM examples: "Jeans", "Pants", "Trousers", "Joggers", "Skirts", "Shorts"
   - Then suggest ONLY roles: "top", "shoes", "accessories"
   - NEVER include another "bottom".

3) If baseItem.category is an ACCESSORY:
   - ACCESSORY examples: "Watches", "Belts", "Bags", "Handbags", "Jewelry"
   - Then suggest ONLY roles: "top", "bottom", "shoes"
   - Do NOT return "accessories" because the base item is already an accessory.

4) If the baseItem.category is a cosmetic or personal care item (like "Cosmetics", "Makeup", "Personal Care"):
   - You MUST return an empty outfitItems array.
   - And set outfitTitle to "Not applicable" and overallStyleExplanation to
     "Outfit suggestions are not available for cosmetic items."
   - This is mandatory.

--- COLOR & STYLE RULES ---

- Use colorSuggestion and colorHexSuggestion that follow fashion logic:
  - Dark top -> suggest lighter bottom.
  - Light top -> suggest darker bottom.
  - Neutral colors (black, white, beige, navy, grey) pair with almost anything.
- Respect userPreferences.avoidColors: never suggest those colors.
- Consider userPreferences.styleVibe:
  - "simple_elegant": fewer patterns, neutral tones.
  - "street_casual": denim, sneakers, casual styles.
  - "office_formal": shirts, trousers, blazers, formal shoes.
  - "party_bold": stronger contrast, prints, eye-catching pieces.

- Use max 3–4 outfitItems.
- Each outfitItem must have:
  - role: "top", "bottom", "shoes" or "accessories"
  - suggestedType: simple clothing type, e.g. "slim fit jeans", "white sneakers", "silver watch".
  - colorSuggestion: plain color name like "navy blue", "black", "white", "beige".
  - colorHexSuggestion: hex code for that color if possible (#RRGGBB).
  - patternSuggestion: "solid", "striped", "checked", "printed" or similar.
  - reason: short explanation of why it matches.

- IMPORTANT: Return ONLY JSON. No markdown, no text outside JSON.
`;

const OUTFIT_OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    outfitTitle: { type: "string" },
    baseItemId: { type: "string" },
    outfitItems: {
      type: "array",
      items: {
        type: "object",
        properties: {
          role: { type: "string" }, // "top" | "bottom" | "shoes" | "accessories"
          suggestedType: { type: "string" },
          colorSuggestion: { type: "string" },
          colorHexSuggestion: { type: "string" },
          patternSuggestion: { type: "string" },
          reason: { type: "string" }
        },
        required: ["role", "suggestedType", "colorSuggestion"]
      }
    },
    overallStyleExplanation: { type: "string" },
    tags: { type: "array", items: { type: "string" } }
  },
  required: ["outfitTitle", "outfitItems"]
};

export async function generateAIOutfits(inputData: any) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Gemini API Key missing. Cannot generate outfit.");
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: JSON.stringify(inputData) }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: OUTFIT_OUTPUT_SCHEMA,
        systemInstruction: OUTFIT_GENERATION_RULES + "\n\nIMPORTANT: Do NOT be conservative. Suggest BOLD, CONTRASTING color combinations. It is okay to clash slightly. Prioritize variety and Exploration.",
        temperature: 0.8,
      },
    });

    if (!response.text) {
      console.error("Gemini Outfit Generation Error: Response text is empty.");
      return {
        outfitTitle: "Error Generating Outfit",
        outfitItems: [],
        overallStyleExplanation:
          "The AI stylist failed to generate a suggestion because the response was empty.",
        tags: ["error"],
      };
    }

    const jsonString = response.text.trim();
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Gemini Outfit Generation Error:", error);
    return {
      outfitTitle: "Error Generating Outfit",
      outfitItems: [],
      overallStyleExplanation:
        "The AI stylist failed to generate a suggestion. Please try again.",
      tags: ["error"],
    };
  }
}
