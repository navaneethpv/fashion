import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Buffer } from 'buffer';
import fs from 'fs/promises'; // Using promises version of fs for async/await
import getColors from 'get-image-colors';
import axios from 'axios';
import dotenv from 'dotenv';

// --- ONE-TIME CONFIGURATION ---
// This code runs only once when the file is first imported anywhere in your app.
// This is the standard and most reliable way to handle configuration.
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// --- TYPE DEFINITIONS for better code safety ---
export interface ColorData {
  hex: string;
  r: number;
  g: number;
  b: number;
}

export interface UploadResult {
  url: string;
  colorData: ColorData;
  publicId?: string; // include publicId so callers can persist a non-null external id
}


// --- HELPER FUNCTIONS ---

/**
 * Helper function to extract the dominant color from an image Buffer.
 * @param buffer The image data as a Buffer.
 * @returns A promise that resolves to the dominant color data.
 */
const analyzeColor = async (buffer: Buffer): Promise<ColorData> => {
  try {
    const colors = await getColors(buffer, 'image/jpeg');
    const dominant = colors[0];
    return {
      hex: dominant.hex(),
      r: dominant.rgb()[0],
      g: dominant.rgb()[1],
      b: dominant.rgb()[2],
    };
  } catch (error) {
    console.error("Color analysis failed, defaulting to black.", error);
    return { hex: '#000000', r: 0, g: 0, b: 0 };
  }
};


// --- CORE UPLOAD FUNCTIONS ---

/**
 * **(Primary function for ingestion script)**
 * Uploads a local image file to Cloudinary, analyzes its color, and returns all data.
 * @param localFilePath The path to the local image file.
 * @param publicId The desired public ID (e.g., product ID) for the image in Cloudinary.
 * @returns A promise resolving to an object with the secure URL and color data.
 */
export const uploadLocalImageToCloudinary = async (
  localFilePath: string,
  publicId?: string
): Promise<UploadResult> => {
  try {
    // ensure we always produce a non-null publicId to avoid duplicate-null DB index inserts
    const computedPublicId = publicId ?? `product_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;

    // 1. Read the local file into a buffer for color analysis
    const buffer = await fs.readFile(localFilePath);
    
    // 2. Perform color analysis and image upload concurrently for speed
    const [colorData, uploadResponse] = await Promise.all([
        analyzeColor(buffer),
        cloudinary.uploader.upload(localFilePath, {
            public_id: computedPublicId,
            folder: 'eyoris-fashion', // Organizes images into a specific folder
            overwrite: true,
        })
    ]);

    if (!uploadResponse || !uploadResponse.secure_url) {
        throw new Error('Cloudinary did not return a valid response.');
    }

    // 3. Return the combined result including the computed publicId
    return {
      url: uploadResponse.secure_url,
      colorData: colorData,
      publicId: computedPublicId,
    };
  } catch (error) {
    console.error(`Error processing local image ${localFilePath}:`, error);
    throw new Error('Failed to upload and analyze local image.');
  }
};


/**
 * Uploads an image from a Buffer to Cloudinary (e.g., from a user upload).
 * @param buffer The image file as a Buffer.
 * @returns A promise resolving to an object with the secure URL and color data.
 */
export const uploadImageBuffer = async (buffer: Buffer, publicId?: string): Promise<UploadResult> => {
    // ensure non-null publicId
    const computedPublicId = publicId ?? `product_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;

    // Analyze color first
    const colorData = await analyzeColor(buffer);

    // Use a modern async/await pattern for upload_stream and include public_id
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { folder: "eyoris-fashion", public_id: computedPublicId },
            (error, result) => {
                if (error || !result) {
                    return reject(new Error(error?.message || "Cloudinary Upload Stream Failed"));
                }
                resolve({ url: result.secure_url, colorData, publicId: computedPublicId });
            }
        );
        uploadStream.end(buffer);
    });
};


/**
 * Downloads an image from a URL, analyzes its color, and returns the data.
 * Useful for one-off analysis or migrating from a URL-based dataset.
 * @param url The public URL of the image to analyze.
 * @returns A promise resolving to an object with the original URL and color data.
 */
export const analyzeImageUrl = async (url: string, publicId?: string): Promise<UploadResult> => {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data, 'binary');
        const colorData = await analyzeColor(buffer);
        const computedPublicId = publicId ?? `product_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
        return { url, colorData, publicId: computedPublicId };
    } catch (error) {
        console.error(`Failed to download or analyze image from URL: ${url}`, error);
        throw new Error('Image analysis from URL failed.');
    }
}