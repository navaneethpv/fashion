import { v2 as cloudinary } from 'cloudinary';
import { Buffer } from 'buffer';
import getColors from 'get-image-colors';
import axios from 'axios';
import dotenv from 'dotenv'; // 👈 ADD DOTENV IMPORT

// Function to conditionally load .env only if not already loaded (safer)
const loadEnvIfMissing = () => {
    if (!process.env.CLOUDINARY_API_KEY) {
        dotenv.config(); // 👈 Load .env
    }
}

const configureCloudinary = () => {
    // 1. Ensure env is loaded first
    loadEnvIfMissing(); // 👈 CALL LOAD HERE

    // 2. Configure Cloudinary only if the keys are now available
    if (!cloudinary.config().api_key && process.env.CLOUDINARY_API_KEY) {
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });
    }
}

// Helper to extract dominant color from an image Buffer
const analyzeColor = async (buffer: Buffer): Promise<{ hex: string; r: number; g: number; b: number }> => {
  // ... (keep this function as is) ...
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
    console.error("Color analysis failed, defaulting to black.");
    return { hex: '#000000', r: 0, g: 0, b: 0 };
  }
};


/**
 * Uploads an image (Buffer) to Cloudinary.
 */
export const uploadImageBuffer = async (buffer: Buffer): Promise<{ url: string; colorData: any }> => {
  configureCloudinary(); // CRITICAL: ensures keys are read

  const colorData = await analyzeColor(buffer);
  
  return new Promise((resolve, reject) => {
    // ... rest of the code is fine
    cloudinary.uploader.upload_stream({ folder: "eyoris-products" }, (error, result) => {
      if (error || !result) return reject(new Error(error?.message || "Cloudinary Upload Failed"));
      resolve({ url: result.secure_url, colorData });
    }).end(buffer);
  });
};


/**
 * Downloads an image from a URL, analyzes it, and returns the data.
 */
export const analyzeImageUrl = async (url: string): Promise<{ url: string; colorData: any }> => {
    // It's safer to configure here too if this function were used outside of the main API flow
    // configureCloudinary(); 
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data, 'binary');
    const colorData = await analyzeColor(buffer);
    return { url, colorData };
}