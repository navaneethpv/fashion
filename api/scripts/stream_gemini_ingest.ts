/**
 * @file stream_gemini_ingest.ts
 * @description Ingestion script for the Eyoris Fashion project.
 *
 * This script streams a large JSON dataset, processes each product, and populates the MongoDB database.
 * For each product, it performs the following enrichment steps:
 * 1. Downloads the product image from its URL.
 * 2. Extracts the EXACT dominant color (HEX/RGB) using `get-image-colors`.
 * 3. Uses the Google Gemini Vision Pro API to generate RICH semantic tags.
 * 4. Creates a URL-friendly slug.
 * 5. Inserts the fully enriched product data into MongoDB in batches.
 *
 * @usage
 * 1. Place 'ai_outfit_dataset.csv' or similar in the root of the '/api' directory.
 * 2. Configure the DATASET_FILE_PATH variable below.
 * 3. Run from the '/api' directory: `ts-node scripts/stream_gemini_ingest.ts`
 */

import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import axios from 'axios';
import getColors from 'get-image-colors';
import { GoogleGenerativeAI } from '@google/genai';
import csv from 'csv-parser'; // Using csv-parser for your filtered dataset
import slugify from 'slugify';

// Local Imports - Adjust paths if necessary
import connectDB from '../src/config/db';
import Product from '../src/models/Product';

// --- TYPE DEFINITIONS for Type Safety ---
interface RawProductData {
    id: string;
    gender: string;
    masterCategory: string;
    subCategory: string;
    articleType: string;
    baseColour: string;
    season: string;
    year: string;
    usage: string;
    productDisplayName: string;
    // This is from the Kaggle CSV. The image will be constructed.
}

interface DominantColor {
    hex: string;
    rgb: number[];
}

interface AITags {
    semanticColor?: string;
    style_tags?: string[];
    material_tags?: string[];
}

// This should match your Mongoose Product Schema
interface EnrichedProduct {
    name: string;
    slug: string;
    description: string;
    price: number;
    category: string;
    images: string[];
    brand: string;
    color: string;
    gender: string;
    dominantColor: DominantColor;
    aiTags: AITags;
    // ... any other fields from your schema
}


// --- CONFIGURATION ---
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// IMPORTANT: Using the filtered CSV you created
const DATASET_FILE_PATH = path.join(__dirname, '..', 'ai_outfit_dataset.csv');
const LOCAL_IMAGES_PATH = path.join(__dirname, '..', 'images');
const BATCH_SIZE = 10; // Smaller batch size is better when dealing with heavy async operations
const DISABLE_GEMINI_FOR_INGESTION = false; // SET TO `true` FOR FAST, AI-FREE TESTING.

// --- INITIALIZATION ---
if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not defined in the .env file');
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const geminiVisionModel = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });


/**
 * Processes a single product data object from the CSV.
 * Reads the local image, extracts colors, gets AI tags, and returns an object for DB insertion.
 * @param row - A single product object from the CSV stream.
 * @returns A promise that resolves to the enriched product object or null on failure.
 */
async function processProduct(row: RawProductData): Promise<EnrichedProduct | null> {
  const imageFileName = `${row.id}.jpg`;
  const localImagePath = path.join(LOCAL_IMAGES_PATH, imageFileName);

  if (!fs.existsSync(localImagePath)) {
    console.warn(`[SKIP] Image not found for product ID ${row.id}. Path: ${localImagePath}`);
    return null;
  }

  try {
    // --- 1. Read Image Buffer ---
    const imageBuffer = await fs.promises.readFile(localImagePath);

    // --- 2. Local Extraction for EXACT Technical Color ---
    const colors = await getColors(imageBuffer, { count: 1, type: 'image/jpeg' });
    const dominantColor = colors[0];
    const dominantHex = dominantColor.hex();
    const dominantRgb = dominantColor.rgb();

    const enrichedProduct: Partial<EnrichedProduct> = {
      name: row.productDisplayName,
      slug: slugify(row.productDisplayName, { lower: true, strict: true, remove: /[*+~.()'"!:@]/g }),
      description: row.productDisplayName, // Placeholder description
      price: Math.floor(Math.random() * (4000 - 500 + 1) + 500), // Random price for demo
      category: row.masterCategory,
      images: [], // Will be populated after upload
      brand: 'Eyoris', // Placeholder brand
      color: row.baseColour,
      gender: row.gender,
      dominantColor: {
        hex: dominantHex,
        rgb: dominantRgb,
      },
      aiTags: {}, // Initialize aiTags
    };
    console.log(`[COLOR] Extracted dominant color ${dominantHex} for: ${row.productDisplayName}`);

    // --- 3. AI (Gemini) for RICH Semantic Description ---
    if (!DISABLE_GEMINI_FOR_INGESTION) {
      const prompt = `
        Analyze the primary clothing item in this image, ignoring the background.
        Respond with a clean JSON object containing these exact keys:
        1. "semanticColor": A specific, human-readable name for the item's main color (e.g., "Charcoal Gray", "Maroon", "Teal Blue").
        2. "style_tags": An array of 3-5 relevant style keywords (e.g., "minimalist", "bohemian", "formal", "casual", "streetwear").
        3. "material_tags": An array of 1-3 perceived material tags (e.g., "cotton", "denim", "silk", "leather").
      `;

      const imagePart = { inlineData: { data: imageBuffer.toString('base64'), mimeType: 'image/jpeg' } };
      const result = await geminiVisionModel.generateContent([prompt, imagePart]);
      const responseText = result.response.text();

      // Robust JSON Parsing
      try {
        const cleanedJsonString = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const aiData = JSON.parse(cleanedJsonString);
        enrichedProduct.aiTags = {
          semanticColor: aiData.semanticColor,
          style_tags: aiData.style_tags,
          material_tags: aiData.material_tags,
        };
        console.log(`[GEMINI] Generated semantic color "${aiData.semanticColor}" for: ${row.productDisplayName}`);
      } catch (jsonError) {
        console.warn(`[WARN] Gemini returned non-JSON response for "${row.productDisplayName}". Skipping AI tags. Response: ${responseText}`);
      }
    }
    
    // NOTE: This version does not upload to Cloudinary to match your script.
    // If you need Cloudinary upload, you would add that logic here and set enrichedProduct.images
    // For now, we use a placeholder.
    enrichedProduct.images = [`/placeholder/path/${imageFileName}`];

    return enrichedProduct as EnrichedProduct;

  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[ERROR] Failed to process product "${row.productDisplayName}" (ID: ${row.id}). Reason: ${errorMessage}`);
    return null; // Skip this product on any failure
  }
}

/**
 * Main function to orchestrate the ingestion process.
 */
async function runIngestion() {
  console.log('--- Starting Eyoris Fashion Data Ingestion ---');
  await connectDB();

  console.log('Clearing existing products from the database...');
  await Product.deleteMany({});
  console.log('✅ Database cleared.');

  const stream = fs.createReadStream(DATASET_FILE_PATH).pipe(csv());
  let productBatch: EnrichedProduct[] = [];
  let processedCount = 0;
  let successCount = 0;
  let errorCount = 0;

  console.log(`Streaming from ${DATASET_FILE_PATH}...`);

  for await (const row of stream) {
    processedCount++;
    console.log(`[${processedCount}] Processing: ${row.productDisplayName}`);
    
    const processedProduct = await processProduct(row as RawProductData);

    if (processedProduct) {
      productBatch.push(processedProduct);
      successCount++;
    } else {
      errorCount++;
    }

    if (productBatch.length >= BATCH_SIZE) {
      await Product.insertMany(productBatch);
      console.log(`--- DB INSERT: Inserted a batch of ${productBatch.length}. Total successful: ${successCount} ---`);
      productBatch = []; // Clear the batch
    }
  }
  
  // Final batch insertion
  if (productBatch.length > 0) {
    await Product.insertMany(productBatch);
    console.log(`--- DB INSERT: Inserted final batch of ${productBatch.length}. Total successful: ${successCount} ---`);
  }
  
  console.log('\n--- Ingestion Complete! ---');
  console.log(`Total items read from file: ${processedCount}`);
  console.log(`✅ Successfully processed and saved: ${successCount}`);
  console.log(`❌ Skipped due to errors: ${errorCount}`);
  console.log('-----------------------------\n');
  await mongoose.connection.close();
  process.exit(0);
}

// Execute the script
runIngestion().catch(error => {
  console.error('An unhandled error occurred during the ingestion process:', error);
  process.exit(1);
});