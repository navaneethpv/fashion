/**
 * Safe Removal Script for Eyoris
 * ✔ Deletes ALL MongoDB products
 * ✔ Deletes Cloudinary images under folder 'eyoris/*'
 * ⚠️ Requires user confirmation to avoid accidental deletion
 */

import dotenv from "dotenv";
dotenv.config();

import readline from "readline";
import { connectDB } from "../src/config/db";
import { Product } from "../src/models/Product";
import cloudinary from "../src/config/cloudinary";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askConfirm(question: string): Promise<boolean> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      const normalized = answer.trim().toLowerCase();
      rl.close();
      resolve(normalized === "yes" || normalized === "y");
    });
  });
}

// helper to split array into chunks
function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

async function deleteCloudinaryImages() {
  console.log("🗑 Deleting Cloudinary images inside folder: eyoris/* ...");

  try {
    let totalDeleted = 0;
    let nextCursor: string | undefined = undefined;

    while (true) {
      const res: any = await cloudinary.search
        .expression("folder:eyoris/*")
        .max_results(500) // get up to 500 at a time
        .next_cursor(nextCursor)
        .execute();

      const resources = res.resources ?? [];
      if (resources.length === 0) break;

      const publicIds: string[] = resources.map((r: any) => String(r.public_id));

      // ❗ Cloudinary only allows 100 public_ids per delete call
      const batches = chunkArray(publicIds, 100);

      for (const batch of batches) {
        if (batch.length === 0) continue;
        await cloudinary.api.delete_resources(batch);
        totalDeleted += batch.length;
        console.log(`   🔹 Deleted ${batch.length} images in this batch...`);
      }

      nextCursor = res.next_cursor;
      if (!nextCursor) break;
    }

    console.log(`🧹 Total Cloudinary images deleted: ${totalDeleted}`);

    // Try to remove root folder if empty
    try {
      await cloudinary.api.delete_folder("eyoris");
      console.log("📁 Removed root folder eyoris/");
    } catch (_) {
      console.log("📁 Some eyoris/* subfolders may still exist (non-empty).");
    }
  } catch (err: any) {
    console.error("❌ Cloudinary delete failed:", err.message || err);
  }
}

async function deleteProducts() {
  console.log("🗑 Removing all products from MongoDB...");
  const count = await Product.countDocuments();
  if (count === 0) {
    console.log("⚠️ No products found in DB to delete.");
    return;
  }

  await Product.deleteMany({});
  console.log(`🧹 Removed ${count} product documents.`);
}

async function run() {
  console.log(`⚠️ WARNING: You are about to permanently delete:
  
  🔸 ALL products in MongoDB
  🔸 ALL Cloudinary images under folder "eyoris/*"
  
  ❌ This action CANNOT be undone.
  
  To continue, type: yes
  `);

  const confirmed = await askConfirm("Type YES to confirm: ");

  if (!confirmed) {
    console.log("🚫 Operation cancelled. Nothing was deleted.");
    process.exit(0);
    return;
  }

  await connectDB();
  console.log("🔌 Database connected");

  await deleteProducts();
  await deleteCloudinaryImages();

  console.log("\n🎉 Cleanup finished. Check logs above for details.\n");
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Cleanup script failed:", err);
  process.exit(1);
});
