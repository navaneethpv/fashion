import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import axios from 'axios';
import { Product } from '../src/models/Product';
import { generateImageEmbedding } from '../src/utils/visualSearchAI';

// Initialize environment
dotenv.config({ path: path.join(__dirname, '../.env') });

const DELAY_MS = 500;
const BATCH_SIZE = 1; // Process one at a time for safety

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function connectDB() {
    if (!process.env.MONGO_URI) {
        console.error("❌ MONGO_URI is missing in .env");
        process.exit(1);
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");
}

async function downloadImage(url: string): Promise<{ buffer: Buffer, mimeType: string } | null> {
    try {
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 10000
        });
        const buffer = Buffer.from(response.data);
        const mimeType = response.headers['content-type'] || 'image/jpeg';
        return { buffer, mimeType };
    } catch (error: any) {
        console.warn(`⚠️ Failed to download image: ${url} - ${error.message}`);
        return null; // Skip this image
    }
}

async function backfillEmbeddings() {
    await connectDB();

    try {
        // Find products where imageEmbedding is missing (null or undefined) OR empty array
        // AND images array has at least one item
        const query = {
            $or: [
                { imageEmbedding: { $exists: false } }, // Field missing
                { imageEmbedding: null },              // Field is null
                { imageEmbedding: { $size: 0 } }       // Empty array
            ],
            images: { $exists: true, $not: { $size: 0 } } // Must have images
        };

        const totalCount = await Product.countDocuments(query);
        console.log(`🚀 Found ${totalCount} products requiring image embeddings.`);

        if (totalCount === 0) {
            console.log("✅ All products already have embeddings.");
            process.exit(0);
        }

        // Process using a cursor to handle large datasets efficiently
        // Note: We use find().cursor() for streaming, but since we are modifying docs that match the query,
        // regular cursor might skip or re-process if sort order changes. 
        // Simplest safe way for backfill is to output IDs and process them, or just strictly iterate.
        // Given BATCH_SIZE=1 and sequential, we can just fetch one-by-one or use a cursor. A cursor is fine.

        const cursor = Product.find(query).cursor();

        let processed = 0;
        let success = 0;
        let skipped = 0;
        let failed = 0;

        for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
            processed++;
            const currentSlug = doc.slug || doc._id;
            console.log(`\n[${processed}/${totalCount}] Processing: ${currentSlug}`);

            try {
                // Get first image
                const imageUrl = doc.images[0];
                if (!imageUrl) {
                    console.log(`   ⏭️ Skipped: No valid image URL.`);
                    skipped++;
                    continue;
                }

                // Handle local uploads (if they are stored with relative paths locally, we might need full URL)
                // If the URL is relative (starts with /), prepend API_URL or base.
                // Assuming typical URLs are absolute or we can construct them.
                let processUrl = imageUrl;
                if (!imageUrl.startsWith('http')) {
                    // Try to construct absolute URL if it is a local upload
                    // This is tricky if running as script. Let's assume standard http for now, 
                    // or if valid local file path exists. 
                    // If it's just "/uploads/foo.jpg", we need the server address.
                    // The script runs locally, so localhost:4000 might work if server is running.
                    const baseUrl = process.env.API_URL || 'http://localhost:4000';
                    processUrl = `${baseUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
                }

                console.log(`   📥 Downloading: ${processUrl}`);
                const image = await downloadImage(processUrl);

                if (!image) {
                    console.log(`   ⏭️ Skipped: Download failed.`);
                    skipped++;
                    continue;
                }

                console.log(`   🧠 Generating Embedding...`);
                const embedding = await generateImageEmbedding(image.buffer, image.mimeType);

                if (embedding && embedding.length > 0) {
                    // Update Product
                    await Product.updateOne(
                        { _id: doc._id },
                        { $set: { imageEmbedding: embedding } }
                    );
                    console.log(`   ✅ Success! Embedding saved.`);
                    success++;
                } else {
                    console.log(`   ⚠️ Skipped: No embedding generated (Quota/Error).`);
                    // We don't mark as failed in terms of "crash", just skipped processing for now.
                    skipped++;
                }

            } catch (err: any) {
                console.error(`   ❌ Failed: ${err.message}`);
                failed++;
            }

            // Safety delay
            await sleep(DELAY_MS);
        }

        console.log(`\n🎉 Backfill Complete!`);
        console.log(`Total Processed: ${processed}`);
        console.log(`Success: ${success}`);
        console.log(`Skipped: ${skipped}`);
        console.log(`Failed: ${failed}`);

    } catch (error) {
        console.error("Script Error:", error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

// Run
backfillEmbeddings();
