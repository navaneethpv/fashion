import { GoogleGenAI } from "@google/genai";
import { Buffer } from "buffer";
import dotenv from "dotenv";
import axios from 'axios';

dotenv.config();

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!,
});

function bufferToGenerativePart(buffer: Buffer, mimeType: string) {
    return {
        inlineData: {
            data: buffer.toString("base64"),
            mimeType,
        },
    };
}

export interface VisualAnalysisResult {
    category: string;
    aiTags: string[];
    dominantColor: {
        name: string;
        hex: string;
        rgb: [number, number, number];
    };
}

const ALL_CATEGORIES = [
    // Clothing - Tops
    "Tshirts", "Shirts", "Tops", "Sweatshirts", "Sweaters", "Kurtas", "Kurtis",
    // Clothing - Bottoms
    "Jeans", "Trousers", "Shorts", "Leggings", "Track Pants",
    // Clothing - Dresses & Full Body
    "Dresses", "Jumpsuits", "Sarees", "Shrugs", "Jackets", "Blazers",
    // Footwear - Specific Types (not broad "Footwear")
    "Heels", "Flats", "Sandals", "Sports Sandals", "Sports Shoes", "Casual Shoes", "Formal Shoes", "Flip Flops",
    // Accessories - Specific Types (not broad "Accessories")
    "Watches", "Sunglasses", "Belts", "Caps", "Wallets", "Ties", "Scarves",
    // Bags - Specific Types
    "Handbags", "Backpacks", "Clutches", "Laptop Bag",
    // Jewelry
    "Jewellery Set", "Earrings", "Bracelet", "Bangle", "Ring"
];

const ANALYSIS_SCHEMA = {
    type: "object",
    properties: {
        category: {
            type: "string",
            description: `Must be exactly one from: ${ALL_CATEGORIES.join(", ")}`
        },
        aiTags: {
            type: "array",
            items: { type: "string" },
            description: "Semantic attributes like pattern (floral, solid), style (casual, formal), type (maxi, slim-fit)"
        },
        dominantColor: {
            type: "object",
            properties: {
                name: { type: "string" },
                hex: { type: "string" }
            },
            required: ["name", "hex"]
        }
    },
    required: ["category", "aiTags", "dominantColor"]
};

const hexToRgb = (hex: string): [number, number, number] => {
    const cleanHex = hex.replace("#", "");
    const bigint = parseInt(cleanHex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return [r, g, b];
};

export async function analyzeImageForVisualSearch(
    imageBuffer: Buffer,
    mimeType: string
): Promise<VisualAnalysisResult> {
    try {
        const imagePart = bufferToGenerativePart(imageBuffer, mimeType);

        const prompt = `Analyze this fashion image and extract metadata for visual search. 
    Focus on the main garment. 
    Identify the broad category (ONLY from the allowed list), key semantic attributes (style, pattern, material), and the dominant color of the item itself.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: "user", parts: [imagePart, { text: prompt }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: ANALYSIS_SCHEMA as any,
                temperature: 0.1,
            },
        });

        const parsed = JSON.parse(response.text!);

        return {
            category: parsed.category,
            aiTags: parsed.aiTags,
            dominantColor: {
                name: parsed.dominantColor.name,
                hex: parsed.dominantColor.hex,
                rgb: hexToRgb(parsed.dominantColor.hex)
            }
        };
    } catch (err: any) {
        console.error("[VISUAL SEARCH AI] Analysis Error:", err);
        console.error("[VISUAL SEARCH AI] Error Name:", err.name);
        console.error("[VISUAL SEARCH AI] Error Message:", err.message);

        // Provide helpful error message
        let errorMessage = "Failed to analyze image for visual search.";
        if (err.message?.toLowerCase().includes('api key')) {
            errorMessage = "Invalid or missing Gemini API key. Please check your .env file.";
        } else if (err.message?.toLowerCase().includes('quota')) {
            errorMessage = "Gemini API quota exceeded. Please try again later.";
        } else if (err.message) {
            errorMessage = `Analysis failed: ${err.message}`;
        }

        throw new Error(errorMessage);
    }
}

/**
 * Generates a vector embedding for the given image.
 * Uses the 'text-embedding-004' or a multimodal embedding model if available.
 * For now, we will use 'models/embedding-001' which supports text, 
 * OR if using the latest SDK, we check for multimodal support.
 * 
 * NOTE: As of now, standard Gemini API embedding models are primarily text-based.
 * However, 'multimodal-embedding-001' exists in Vertex AI.
 * For the standard Google AI Studio API, we often use `embedding-001` for text.
 * 
 * UPDATE: We will use the `embedding-001` model which accepts 'content' including images in some versions,
 * or we will use a workaround if needed. 
 * 
 * ACTUALLY: The safest bet for generic "Google Gen AI" image embeddings 
 * without Vertex AI specific setup is to use the `embedding-001` model 
 * but passing the image as a part. 
 * 
 * Re-checking docs: Google AI Studio supports 'models/embedding-001' which is text-only.
 * 'models/multimodal-embedding-001' is required for images.
 * If that is not available via the standard API key, this might fail.
 * 
 * PLAN B (Safer for this audit): 
 * We will TRY to use `models/embedding-001` with the image part.
 * If it fails, we catch it.
 */
export async function generateImageEmbedding(
    imageBuffer: Buffer,
    mimeType: string
): Promise<number[] | undefined> {
    try {
        // Strategy: Since standard Google AI Studio keys might not have access to 'multimodal-embedding-001',
        // we will use a robust fallback:
        // 1. Generate a dense description of the image using a Vision model.
        // 2. Embed that text description using a Text Embedding model.

        // Step 1: Get Description
        const description = await generateImageDescription({ imageBuffer, mimeType });

        if (!description) {
            console.warn("[VISUAL SEARCH AI] Failed to generate description for embedding.");
            return undefined;
        }

        // Step 2: Embed Description
        // Using 'models/text-embedding-004' which is better, or 'models/embedding-001'
        const result = await ai.models.embedContent({
            model: "models/text-embedding-004",
            contents: [{ parts: [{ text: description }] }]
        });

        // Handle various response shapes
        const response: any = result;
        if (response.embedding && response.embedding.values) {
            return response.embedding.values;
        }

        if (response.embeddings && response.embeddings.length > 0 && response.embeddings[0].values) {
            return response.embeddings[0].values;
        }

        return undefined;

    } catch (err: any) {
        console.warn("[VISUAL SEARCH AI] Embedding Generation Failed:", err.message);
        return undefined;
    }
}

/**
 * Generates a concise product description from an image.
 * Supports both URL (fetches first) and Buffer.
 */
export async function generateImageDescription(input: {
    imageUrl?: string;
    imageBuffer?: Buffer;
    mimeType?: string;
}): Promise<string | null> {
    try {
        let buffer = input.imageBuffer;
        let mime = input.mimeType || "image/jpeg";

        // Fetch from URL if buffer not provided
        if (!buffer && input.imageUrl) {
            try {
                const response = await axios.get(input.imageUrl, {
                    responseType: "arraybuffer",
                    timeout: 10000,
                });
                buffer = Buffer.from(response.data);
                mime = response.headers["content-type"] || mime;
            } catch (err) {
                console.warn(`[GENERATE_DESCRIPTION] Failed to fetch image from URL: ${input.imageUrl}`);
                return null;
            }
        }

        if (!buffer) return null;

        const imagePart = bufferToGenerativePart(buffer, mime);
        const prompt = `Describe this fashion product in plain English for a search index. 
    Focus on: Product Type, Material (if visible), Key Style/Pattern, and Gender (if obvious).
    Keep it concise (1-2 sentences). Do not use markdown or specialized formatting.`;

        const result = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: "user", parts: [imagePart, { text: prompt }] }],
            config: {
                maxOutputTokens: 100,
                temperature: 0.2,
            },
        });

        return result.text || null;

    } catch (error: any) {
        console.warn("[GENERATE_DESCRIPTION] AI Generation Failed:", error.message);
        return null; // Fail-safe
    }
}
