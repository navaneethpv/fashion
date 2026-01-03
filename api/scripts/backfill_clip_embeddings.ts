
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import axios from 'axios';
import { Product } from '../src/models/Product';
import { generateClipEmbedding } from '../src/services/clipEmbeddingService';

// Initialize environment
dotenv.config({ path: path.join(__dirname, '../.env') });

const DELAY_MS = 500;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function connectDB() {
    if (!process.env.MONGO_URI) {
        console.error("❌ MONGO_URI is missing in .env");
        process.exit(1);
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");
}

async function downloadImage(url: string): Promise<Buffer | null> {
    try {
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 10000
        });
        return Buffer.from(response.data);
    } catch (error: any) {
        console.warn(`⚠️ Failed to download image: ${url} - ${error.message}`);
        return null; // Skip this image
    }
}

async function backfillEmbeddings() {
    await connectDB();

    try {
        // Query: Products missing 'imageEmbedding' OR where it is null/empty
        // Note: If you want to replace ALL embeddings (Gemini -> CLIP), remove the filter.
        // But per instructions: "Query only products where imageEmbedding is missing or empty"
        // Wait, instructions said: "CLIP will REPLACE Gemini ONLY for IMAGE EMBEDDINGS."
        // And "Query only products where imageEmbedding is missing or empty".
        // Use the safe approach first.

        const query = {
            $or: [
                { imageEmbedding: { $exists: false } },
                { imageEmbedding: null },
                { imageEmbedding: { $size: 0 } }
            ],
            images: { $exists: true, $not: { $size: 0 } }
        };

        const totalCount = await Product.countDocuments(query);
        console.log(`🚀 Found ${totalCount} products requiring CLIP embeddings.`);

        if (totalCount === 0) {
            console.log("✅ All products already have embeddings.");
            process.exit(0);
        }

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
                const imageUrl = doc.images[0];
                if (!imageUrl) {
                    console.log(`   ⏭️ Skipped: No valid image URL.`);
                    skipped++;
                    continue;
                }

                // Construct absolute URL if needed (for local files)
                let processUrl = imageUrl;
                if (!imageUrl.startsWith('http')) {
                    const baseUrl = process.env.API_URL || 'http://localhost:4000';
                    processUrl = `${baseUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
                }

                console.log(`   📥 Downloading: ${processUrl}`);
                const buffer = await downloadImage(processUrl);

                if (!buffer) {
                    console.log(`   ⏭️ Skipped: Download failed.`);
                    skipped++;
                    continue;
                }

                console.log(`   🧠 Generating CLIP Embedding...`);
                // generateClipEmbedding handles error inside and returns null
                const embedding = await generateClipEmbedding(buffer);

                if (embedding && embedding.length > 0) {
                    await Product.updateOne(
                        { _id: doc._id },
                        { $set: { imageEmbedding: embedding } }
                    );
                    console.log(`   ✅ Success! CLIP Embedding saved (${embedding.length}d).`);
                    success++;
                } else {
                    console.log(`   ⚠️ Skipped: Embedding generation returned null.`);
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
