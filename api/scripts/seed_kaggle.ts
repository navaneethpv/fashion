// /api/scripts/seed_kaggle.ts
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import getColors from 'get-image-colors';
import slugify from 'slugify';
import { connectDB } from '../src/config/db';
import cloudinary from '../src/config/cloudinary';
import { Product } from '../src/models/Product';

dotenv.config();

const DATASET_FILE = path.join(__dirname, '..', 'dataset', 'styles.csv');
const IMAGES_FOLDER = path.join(__dirname, '..', 'dataset', 'images');
const MAX_PER_CATEGORY = 500; // Your setting to top-up categories
const BATCH_SIZE = 10;
let DISABLE_GEMINI_FOR_INGESTION = false; // Set to `false` to enable AI
const API_DELAY_MS = 13000;

interface KaggleRow { id: string; gender: string; masterCategory: string; subCategory: string; articleType: string; baseColour: string; season: string; year: string; usage: string; productDisplayName: string; }

let geminiVisionModel: any = null;
if (!DISABLE_GEMINI_FOR_INGESTION) {
    try {
      const { GoogleGenAI } = require('@google/genai');
      const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      geminiVisionModel = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });
      console.log('✅ Gemini client initialized successfully.');
    } catch (e: any) {
      console.error('❌ Failed to initialize Gemini client:', e?.message || e);
      DISABLE_GEMINI_FOR_INGESTION = true;
    }
}

const categoryCount: Record<string, number> = {}; 
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function generateRandomVariants(productId: string, category: string, baseColour: string) {
    const variants = [];
    let sizes: string[] = [];
    switch (category) {
        case 'Apparel': sizes = ['S', 'M', 'L', 'XL']; break;
        case 'Footwear': sizes = ['7', '8', '9', '10']; break;
        default: return [{ size: 'One Size', color: baseColour, sku: `${productId}-OS`, stock: Math.floor(Math.random() * 100) + 10 }];
    }
    for (const size of sizes) {
        variants.push({ size, color: baseColour, sku: `${productId}-${size}`, stock: Math.floor(Math.random() * 100) + 10 });
    }
    return variants;
}
async function uploadToCloudinary(localPath: string, category: string): Promise<string | null> {
    try {
        const res = await cloudinary.uploader.upload(localPath, { folder: `eyoris/${category}`, use_filename: true, unique_filename: false });
        return res.secure_url;
    } catch (err) {
        console.error(`❌ Cloudinary upload failed for ${localPath}:`, (err as any).message || err);
        return null;
    }
}

async function processRow(row: KaggleRow, existingSlugs: Set<string>): Promise<any | null> {
    const id = row.id?.toString().trim();
    if (!id) return null;
    
    const displayName = row.productDisplayName?.trim() || 'Untitled Product';
    const slug = slugify(displayName, { lower: true, strict: true, remove: /[*+~.()'"!:@]/g }) + `-${id}`;

    if (existingSlugs.has(slug)) {
        return null;
    }

    const category = (row.masterCategory || 'Apparel').trim();
    if (categoryCount[category] >= MAX_PER_CATEGORY) {
        return null; 
    }

    const imagePath = path.join(IMAGES_FOLDER, `${id}.jpg`);
    if (!fs.existsSync(imagePath)) return null;

    try {
        const imageUrl = await uploadToCloudinary(imagePath, category);
        if (!imageUrl) return null;
        const imageBuffer = await fs.promises.readFile(imagePath);
        const mimeType = 'image/jpeg';
        const colors = await getColors(imageBuffer, { count: 1, type: mimeType });
        const dominantColorData = {
            hex: colors[0].hex(),
            rgb: { r: colors[0].rgb()[0], g: colors[0].rgb()[1], b: colors[0].rgb()[2] },
        };
        
        let aiTagsData: { semanticColor?: string, style_tags?: string[], material_tags?: string[] } = {};
        if (!DISABLE_GEMINI_FOR_INGESTION && geminiVisionModel) {
            const prompt = `Analyze the clothing item, ignoring the background. Respond with a clean JSON object containing: "semanticColor", "style_tags" (array), and "material_tags" (array).`;
            const imagePart = { inlineData: { data: imageBuffer.toString('base64'), mimeType } };
            try {
                const result = await geminiVisionModel.generateContent([prompt, imagePart]);
                const responseText = result.response.text();
                const cleaned = responseText.replaceAll('```json', '').replaceAll('```', '').trim();
                const aiData = JSON.parse(cleaned);
                aiTagsData = {
                    semanticColor: aiData.semanticColor?.toLowerCase(),
                    style_tags: aiData.style_tags,
                    material_tags: aiData.material_tags,
                };
            } catch (geminiError) {
                console.warn(`⚠️ Gemini call/parsing failed for ID ${id}.`);
            }
        }

        const priceInRupees = Math.floor(199 + Math.random() * 801);
        
        const productDocument = {
            name: displayName,
            slug: slug,
            brand: 'Eyoris Basics',
            category,
            subCategory: row.articleType,
            description: `A stylish ${row.baseColour} ${row.articleType} for the ${row.season} season.`,
            price_cents: priceInRupees * 100,
            price_before_cents: Math.round(priceInRupees * 1.35) * 100,
            images: [{ url: imageUrl }],
            variants: generateRandomVariants(id, category, row.baseColour),
            dominantColor: dominantColorData,
            aiTags: aiTagsData,
            rating: parseFloat((Math.random() * (5 - 3.8) + 3.8).toFixed(1)),
            reviewsCount: Math.floor(Math.random() * 200),
            isPublished: true,
        };
        
        categoryCount[category]++;
        console.log(`[SUCCESS] Added "${displayName}" to "${category}"`);
        return productDocument;

    } catch (error) {
        console.error(`[ERROR] Critical failure on product ID ${id}. Reason: ${(error as Error).message}`);
        return null;
    }
}

async function run() {
    console.log('--- Starting Incremental Seeder (Modern Schema) ---');
    await connectDB();
    console.log('✅ Connected to MongoDB');

    console.log('🔎 Checking database for existing products...');
    const existingProducts = await Product.find({}, { slug: 1, category: 1, _id: 0 }).lean();
    const existingSlugs = new Set(existingProducts.map(p => p.slug));
    
    for (const product of existingProducts) {
        if (!categoryCount[product.category]) categoryCount[product.category] = 0;
        categoryCount[product.category]++;
    }
    console.log(`Found ${existingSlugs.size} existing products.`);
    console.log('Initial category counts:', categoryCount);

    const productBatch: any[] = [];
    let newProductsAdded = 0;
    const stream = fs.createReadStream(DATASET_FILE).pipe(csv());

    for await (const row of stream) {
        stream.pause();
        const productDoc = await processRow(row as KaggleRow, existingSlugs);
        
        if (productDoc) {
            productBatch.push(productDoc);
            newProductsAdded++;
        }
        if (productBatch.length >= BATCH_SIZE) {
            await Product.insertMany(productBatch);
            console.log(`--- 📦 DB INSERT: Wrote batch. New products added: ${newProductsAdded} ---`);
            productBatch.length = 0;
        }
        if (!DISABLE_GEMINI_FOR_INGESTION) {
            await delay(API_DELAY_MS);
        }
        stream.resume();
    }
    
    if (productBatch.length > 0) {
        await Product.insertMany(productBatch);
        console.log(`--- 📦 DB INSERT: Wrote final batch. New products added: ${newProductsAdded} ---`);
    }

    console.log('\n🎉 Incremental Seeding Complete!');
    console.log(`✅ Total new products added: ${newProductsAdded}`);
    console.log('📊 Final category breakdown:', categoryCount);
    await mongoose.disconnect();
}

run().catch(err => {
  console.error('❌ Seeding process failed:', err)
  process.exit(1);
});