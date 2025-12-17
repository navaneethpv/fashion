import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export interface BaseProductInput {
  name: string;
  category: string;
  color: string;
  gender: string;
}

export interface OutfitItemInput {
  name: string;
  category: string;
  color: string;
}

export interface OutfitExplanationResult {
  explanation: string;
  styleTips: string[];
  occasion: string;
}

const OUTFIT_EXPLANATION_SCHEMA = {
  type: "object",
  properties: {
    explanation: { type: "string" },
    styleTips: { type: "array", items: { type: "string" } },
    occasion: { type: "string" },
  },
  required: ["explanation", "styleTips", "occasion"],
};

/**
 * Pure helper that explains an already-selected outfit using Gemini.
 *
 * - DOES NOT query the database
 * - DOES NOT read or return product IDs
 * - DOES NOT modify any selection/filter logic
 */
export async function generateOutfitExplanation(
  baseProduct: BaseProductInput,
  outfitItems: OutfitItemInput[]
): Promise<OutfitExplanationResult | null> {
  if (!process.env.GEMINI_API_KEY) {
    console.error("Gemini API key missing. Skipping outfit explanation.");
    return null;
  }

  const prompt = `
You are an AI fashion stylist. Explain the following outfit in clear, friendly language.

You will receive:
- baseProduct: the main item the user is viewing
- outfitItems: other items that have ALREADY been selected by a separate system

Important rules:
- DO NOT suggest new products.
- ONLY explain and justify why the existing items work well together.
- Focus on color harmony, category pairing (top/bottom/shoes/accessories), gender-appropriate styling, and overall vibe.
- Provide style tips that are specific, practical, and actionable.
- Suggest the single most suitable primary occasion for this outfit (e.g., "casual day out", "office meeting", "party night", "date night", "festive event").

Return a JSON object with this exact shape:
{
  "explanation": string,        // Overall explanation of why this outfit works
  "styleTips": string[],        // 3–5 short bullet-style tips, no markdown
  "occasion": string            // One short phrase describing the main occasion
}

Here is the outfit data:
baseProduct:
${JSON.stringify(baseProduct, null, 2)}

outfitItems:
${JSON.stringify(outfitItems, null, 2)}
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: OUTFIT_EXPLANATION_SCHEMA,
        temperature: 0.4,
      },
    });

    const text = response.text;
    if (!text) {
      console.error("Gemini Outfit Explanation Error: Empty response text.");
      return null;
    }

    const raw = text.trim().replace(/^```json|```$/g, "").trim();

    const parsed = JSON.parse(raw);

    if (
      !parsed ||
      typeof parsed.explanation !== "string" ||
      !Array.isArray(parsed.styleTips) ||
      typeof parsed.occasion !== "string"
    ) {
      console.error("Gemini Outfit Explanation Error: Invalid JSON shape.", parsed);
      return null;
    }

    return {
      explanation: parsed.explanation,
      styleTips: parsed.styleTips,
      occasion: parsed.occasion,
    };
  } catch (error) {
    console.error("Gemini Outfit Explanation Error:", error);
    return null;
  }
}


