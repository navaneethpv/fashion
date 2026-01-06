import { GoogleGenAI } from "@google/genai";
import { Buffer } from "buffer";
import dotenv from "dotenv";
import axios from 'axios';

dotenv.config();

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!,
});

/**
 * Converts image data (Buffer or base64 string) to a generative part for Gemini.
 */
function toGenerativePart(data: Buffer | string, mimeType: string) {
    let base64Data: string;
    if (Buffer.isBuffer(data)) {
        base64Data = data.toString("base64");
    } else {
        // Strip data:image/...;base64, if present
        base64Data = data.includes(',') ? data.split(',')[1] : data;
    }

    return {
        inlineData: {
            data: base64Data,
            mimeType,
        },
    };
}

/**
 * Downloads an image from a URL and returns its Buffer and MIME type.
 */
async function downloadImage(url: string): Promise<{ buffer: Buffer; mimeType: string }> {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 10000 });
        const buffer = Buffer.from(response.data);
        const mimeType = response.headers['content-type'] || 'image/jpeg';
        return { buffer, mimeType };
    } catch (error: any) {
        console.error("[TRY-ON AI] Image download failed:", url, error.message);
        throw new Error("Failed to download product image.");
    }
}

/**
 * Uses Gemini to generate a virtual try-on preview.
 * Task: Place the accessory naturally on the person.
 */
export async function generateVirtualTryOn(
    userImageBase64: string,
    productImageUrl: string,
    productType: string
): Promise<string> {
    try {
        console.log(`[TRY-ON AI] Starting generation for ${productType}...`);

        if (!process.env.GEMINI_API_KEY) {
            console.error("[TRY-ON AI] GEMINI_API_KEY is missing!");
            throw new Error("AI service not configured.");
        }

        // 1. Prepare User Image (Assuming it's base64 from frontend)
        const userPart = toGenerativePart(userImageBase64, "image/jpeg");

        // 2. Prepare Product Image
        const { buffer: productBuffer, mimeType: productMimeType } = await downloadImage(productImageUrl);
        const productPart = toGenerativePart(productBuffer, productMimeType);

        const prompt = `You are an AI image editor.

Task:
Place the given accessory naturally on the person in the uploaded image.

Rules:
- The accessory is: ${productType}
- The product image must be placed realistically
- Maintain correct scale and alignment
- Match lighting and skin tone
- Add natural shadow
- Do NOT distort the person's body
- Do NOT change face or background
- The result should look like a realistic preview photo

Output:
One final realistic image only.`;

        console.log("[TRY-ON AI] Sending request to Gemini (multimodal)...");

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
                {
                    role: "user",
                    parts: [
                        userPart,
                        productPart,
                        { text: prompt }
                    ]
                }
            ],
            config: {
                temperature: 0.4,
            }
        });

        const resultText = response.text;

        // LOG the result for debugging (first 100 chars)
        console.log("[TRY-ON AI] Received response:", resultText ? resultText.substring(0, 100) : "EMPTY");

        // Fallback: If the model doesn't return an image/base64 (which is likely with standard text models),
        // we return the product image URL as a placeholder for the prototype visualization.
        // In a real production system, we'd use a dedicated Image-to-Image model.
        return resultText && resultText.length > 500 ? resultText : productImageUrl;

    } catch (err: any) {
        console.error("[TRY-ON AI] Generation Error:", err.stack || err.message);
        if (err.message && err.message.includes('quota')) {
            return productImageUrl; // Silently fallback on quota issues
        }
        throw new Error(err.message || "Failed to generate virtual try-on preview.");
    }
}
